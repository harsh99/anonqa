#!/usr/bin/env python3
"""
Demo Akamai Bot Manager Standard by sending requests with well-known bot
user-agents and printing the classification Akamai forwarded to the origin.

Authorized testing only — this drives YOUR endpoint on YOUR domain.

How it works: each request goes to /api/echo (a read-only route that reflects
back the Akamai request headers the origin received). If the property is
configured to forward the `Akamai-Bot` header, you'll see the bot type / action
change per user-agent. Bot Manager Standard classifies KNOWN bots mainly by
user-agent, with verified bots (Googlebot, etc.) also checked against Akamai's
IP/DNS ranges — which is why a Googlebot UA from your IP is flagged as an
impersonator rather than the real thing.

Usage:
    python3 scripts/bot-categories.py [BASE_URL]   # default https://www.techintales.com
"""

import json
import sys
import time
import urllib.error
import urllib.request

BASE_URL = (sys.argv[1] if len(sys.argv) > 1 else "https://www.techintales.com").rstrip("/")
PATH = "/api/echo"
DELAY_SECONDS = 0.5

# (label, user-agent). Expected category is a guide — confirm the exact names
# against your Bot Manager category list.
CASES = [
    ("Search engine",     "Googlebot/2.1 (+http://www.google.com/bot.html)"),
    ("Impersonator?",     "Googlebot/2.1 (+http://www.google.com/bot.html)"),  # good UA, your IP
    ("Bing search",       "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)"),
    ("SEO crawler",       "Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)"),
    ("SEO crawler",       "Mozilla/5.0 (compatible; SemrushBot/7~bl; +http://www.semrush.com/bot.html)"),
    ("Social media",      "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)"),
    ("Social media",      "Twitterbot/1.0"),
    ("Site monitoring",   "Mozilla/5.0 (compatible; UptimeRobot/2.0; http://www.uptimerobot.com/)"),
    ("Web archiver",      "Mozilla/5.0 (compatible; archive.org_bot +http://archive.org/details/archive.org_bot)"),
    ("HTTP library",      "python-requests/2.31.0"),
    ("HTTP library",      "curl/8.4.0"),
    ("Automation",        "Wget/1.21.3"),
    ("Real browser",      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                          "(KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"),
]


def fetch(user_agent):
    req = urllib.request.Request(BASE_URL + PATH, method="GET")
    req.add_header("User-Agent", user_agent)
    req.add_header("Accept", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status, json.load(resp)
    except urllib.error.HTTPError as e:
        return e.code, None
    except urllib.error.URLError as e:
        return "ERR", {"reason": str(e.reason)}


def summarize(body):
    """Pull the interesting bits out of the echo response for a one-line view."""
    if not body:
        return "(no body)"
    bot = body.get("akamai_bot")
    if bot:
        # Show whichever fields are present without assuming exact key names.
        keys = ("bot", "type", "action", "category", "name", "score", "method")
        shown = {k: v for k, v in bot.items() if k.lower() in keys}
        return json.dumps(shown or bot, separators=(",", ":"))
    # Akamai-Bot not being forwarded yet — surface any bot-ish header we caught.
    akamai = body.get("akamai") or {}
    botish = {k: v for k, v in akamai.items() if "bot" in k.lower()}
    return json.dumps(botish) if botish else "no Akamai-Bot header (not forwarded?)"


def main():
    print(f"Target: {BASE_URL}{PATH}\n")
    print(f"{'label':<16} {'status':<7} classification")
    print("-" * 72)

    saw_bot_header = False
    for label, ua in CASES:
        status, body = fetch(ua)
        line = summarize(body)
        if body and body.get("akamai_bot"):
            saw_bot_header = True
        print(f"{label:<16} {str(status):<7} {line}")
        time.sleep(DELAY_SECONDS)

    if not saw_bot_header:
        print(
            "\nNo Akamai-Bot header seen on any request. Either the property "
            "isn't forwarding it to origin yet (Property Manager -> Modify "
            "Outgoing Request Header), or these requests aren't traversing "
            "Akamai. Confirm before reading anything into the categories."
        )


if __name__ == "__main__":
    main()
