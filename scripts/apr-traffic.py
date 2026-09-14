#!/usr/bin/env python3
"""
Generate login traffic against /api/logmein to exercise an Akamai Account
Protector configuration.

Authorized testing only — this drives YOUR endpoint on YOUR domain.

Shape of the run (all tunable via the constants below):
  - 10 simulated clients, each with its own username, spoofed IP, and cookie jar
  - 10 requests per client = 100 total, 0.2s apart
  - per client: 5 correct-credential attempts + 5 wrong-password attempts,
    shuffled so successes and failures interleave the way real traffic does
  - user-agent randomized per request from a browser pool

Two things decide whether Account Protector actually sees this (see the repo
discussion): the property must trust an inbound client-IP header for the
spoofed IPs to register as distinct, and Bot Manager must allow the source or
every request comes back 403. The per-request status column makes both obvious.

Usage:
    python3 scripts/apr-traffic.py [BASE_URL]// default https://www.techintales.com
"""

import http.cookiejar
import random
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

# ---- config -----------------------------------------------------------------

BASE_URL = (sys.argv[1] if len(sys.argv) > 1 else "https://www.techintales.com").rstrip("/")
PATH = "/api/logmein"
CORRECT_PASSWORD = "testpwd"          # matches TEST_PASSWORD in the route handler
WRONG_PASSWORD = "wrongpass"
REQUESTS_PER_IP = 10
SUCCESSES_PER_IP = 5                  # the remaining (10 - 5) are failures
DELAY_SECONDS = 0.2                   # baseline gap between requests

# 30% of requests get "think time" — a longer, randomized pause standing in for
# a human reading/typing — instead of the flat baseline gap. This only shapes
# request CADENCE; it does not produce mouse or keystroke telemetry (that needs
# a real browser running Akamai's JS sensor).
HUMAN_THINK_PROBABILITY = 0.30
THINK_TIME_RANGE = (1.0, 4.0)

# One entry per simulated client: (spoofed source IP, username).
# Distinct usernames -> distinct Account Protector user profiles.
# Keep usernames under 20 chars so the correct-password attempts actually pass.
CLIENTS = [
    ("203.0.113.11", "alice_t"),
    ("203.0.113.12", "bob_t"),
    ("203.0.113.13", "carol_t"),
    ("203.0.113.14", "dave_t"),
    ("203.0.113.15", "erin_t"),
    ("198.51.100.21", "frank_t"),
    ("198.51.100.22", "grace_t"),
    ("198.51.100.23", "heidi_t"),
    ("198.51.100.24", "ivan_t"),
    ("198.51.100.25", "judy_t"),
]

# Rotated per request. Each browser is paired with the Sec-CH-UA client hints
# it would actually send — Chromium-family browsers send them, Firefox/Safari
# send none. Mismatched hints (e.g. a Chrome UA with no client hints) are
# themselves a bot signal, so the pairing matters more than the UA string.
BROWSERS = [
    {"ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
     "ch_ua": '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"', "platform": '"Windows"', "mobile": "?0"},
    {"ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
     "ch_ua": None, "platform": None, "mobile": None},  # Safari: no client hints
    {"ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
     "ch_ua": None, "platform": None, "mobile": None},  # Firefox: no client hints
    {"ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
     "ch_ua": '"Not.A/Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"', "platform": '"macOS"', "mobile": "?0"},
    {"ua": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
     "ch_ua": None, "platform": None, "mobile": None},  # iOS Safari: no client hints
    {"ua": "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36",
     "ch_ua": '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"', "platform": '"Android"', "mobile": "?1"},
    {"ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0",
     "ch_ua": '"Microsoft Edge";v="125", "Chromium";v="125", "Not.A/Brand";v="24"', "platform": '"Windows"', "mobile": "?0"},
    {"ua": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
     "ch_ua": '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"', "platform": '"Linux"', "mobile": "?0"},
]

# Rotated per request so the language header isn't a constant fingerprint.
ACCEPT_LANGUAGES = [
    "en-US,en;q=0.9",
    "en-GB,en;q=0.9",
    "en-US,en;q=0.9,es;q=0.8",
    "nl-NL,nl;q=0.9,en;q=0.8",
    "en-US,en;q=0.8,fr;q=0.6",
    "de-DE,de;q=0.9,en;q=0.7",
]

# ---- request ----------------------------------------------------------------


def post_login(opener, ip, username, password, browser):
    """Send one form-urlencoded login. Returns (status, login_result)."""
    body = urllib.parse.urlencode({"username": username, "password": password}).encode()
    req = urllib.request.Request(BASE_URL + PATH, data=body, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    req.add_header("Accept", "application/json")
    req.add_header("User-Agent", browser["ua"])
    req.add_header("Accept-Language", random.choice(ACCEPT_LANGUAGES))
    # Came from the login form, like a real submission would.
    req.add_header("Referer", BASE_URL + "/logmein")
    req.add_header("Origin", BASE_URL)
    # Client hints, but only for browsers that actually send them.
    if browser["ch_ua"]:
        req.add_header("Sec-CH-UA", browser["ch_ua"])
        req.add_header("Sec-CH-UA-Mobile", browser["mobile"])
        req.add_header("Sec-CH-UA-Platform", browser["platform"])
    # Honored only if the property trusts an inbound client-IP header.
    req.add_header("True-Client-IP", ip)
    req.add_header("X-Forwarded-For", ip)

    try:
        with opener.open(req, timeout=30) as resp:
            return resp.status, resp.headers.get("X-Login-Result", "-")
    except urllib.error.HTTPError as e:
        # 401 (expected failures) and 403 (Bot Manager block) land here.
        return e.code, e.headers.get("X-Login-Result", "-")
    except urllib.error.URLError as e:
        return "ERR", str(e.reason)


def build_plan():
    """Per client, a shuffled list of booleans: True = correct password."""
    outcomes = [True] * SUCCESSES_PER_IP + [False] * (REQUESTS_PER_IP - SUCCESSES_PER_IP)
    plan = {}
    for ip, user in CLIENTS:
        seq = outcomes[:]
        random.shuffle(seq)
        plan[(ip, user)] = seq
    return plan


def main():
    plan = build_plan()
    totals = {}

    print(f"Target: {BASE_URL}{PATH}")
    print(f"{len(CLIENTS)} clients x {REQUESTS_PER_IP} requests = "
          f"{len(CLIENTS) * REQUESTS_PER_IP} total, {DELAY_SECONDS}s apart\n")
    print(f"{'#':>3}  {'client-ip':<15} {'username':<9} {'pw':<7} {'status':<7} "
          f"{'pace':<5} result")
    print("-" * 66)

    n = 0
    for (ip, user), outcomes in plan.items():
        # Fresh cookie jar per client so each looks like a distinct device to
        # Bot Manager, rather than 100 requests sharing one long-term cookie.
        jar = http.cookiejar.CookieJar()
        opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
        counts = {"success": 0, "fail": 0, "blocked": 0, "other": 0}

        for correct in outcomes:
            n += 1
            pw = CORRECT_PASSWORD if correct else WRONG_PASSWORD
            browser = random.choice(BROWSERS)
            status, result = post_login(opener, ip, user, pw, browser)

            if status == 200:
                counts["success"] += 1
            elif status == 401:
                counts["fail"] += 1
            elif status == 403:
                counts["blocked"] += 1
            else:
                counts["other"] += 1

            # 30% of requests pause with human-like think time; the rest use the
            # flat baseline gap.
            if random.random() < HUMAN_THINK_PROBABILITY:
                delay = random.uniform(*THINK_TIME_RANGE)
                pace = "think"
            else:
                delay = DELAY_SECONDS
                pace = "fast"

            pw_label = "correct" if correct else "wrong"
            print(f"{n:>3}  {ip:<15} {user:<9} {pw_label:<7} {str(status):<7} "
                  f"{pace:<5} {result}")
            time.sleep(delay)

        totals[(ip, user)] = counts

    print("\nPer-client summary")
    print(f"{'client-ip':<15} {'username':<9} {'ok':>3} {'fail':>5} {'403':>5} {'other':>6}")
    print("-" * 48)
    agg = {"success": 0, "fail": 0, "blocked": 0, "other": 0}
    for (ip, user), c in totals.items():
        print(f"{ip:<15} {user:<9} {c['success']:>3} {c['fail']:>5} {c['blocked']:>5} {c['other']:>6}")
        for k in agg:
            agg[k] += c[k]
    print("-" * 48)
    print(f"{'TOTAL':<25} {agg['success']:>3} {agg['fail']:>5} {agg['blocked']:>5} {agg['other']:>6}")

    if agg["blocked"]:
        print(f"\n{agg['blocked']} request(s) returned 403 — Bot Manager is blocking "
              "scripted traffic. Allowlist this source IP or these won't reach "
              "Account Protector.")


if __name__ == "__main__":
    main()
