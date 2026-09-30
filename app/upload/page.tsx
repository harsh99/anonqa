// app/upload/page.tsx
//
// Drag-and-drop upload UI for the Akamai Malware Protection lab. Posts the
// chosen file to POST /api/upload as multipart/form-data and shows the raw
// response, so you can see both the success JSON and an Akamai deny page.

'use client'

import { useRef, useState } from 'react'

type Result = { status: number; statusText: string; body: string } | null

export default function UploadPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<Result>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) {
      setFile(dropped)
      setResult(null)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file || uploading) return
    setUploading(true)
    setResult(null)
    setError(null)

    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const body = await res.text()
      setResult({ status: res.status, statusText: res.statusText, body })
    } catch (err: any) {
      // A network-level block (e.g. edge reset) lands here rather than as a response.
      setError(err?.message ?? 'Request failed')
    } finally {
      setUploading(false)
    }
  }

  const prettify = (body: string) => {
    try {
      return JSON.stringify(JSON.parse(body), null, 2)
    } catch {
      return body
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upload test</h1>
        <p className="text-sm text-gray-500 mt-1">
          Drops a file to <code>POST /api/upload</code> (multipart/form-data). Nothing is
          stored server-side — this only exercises Akamai Malware Protection.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${
          dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
        }`}
      >
        <p className="text-gray-700 font-medium">
          {file ? file.name : 'Drag & drop a file here'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {file
            ? `${file.size} bytes${file.type ? ` · ${file.type}` : ''}`
            : 'or click to choose a file'}
        </p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const chosen = e.target.files?.[0]
            if (chosen) {
              setFile(chosen)
              setResult(null)
              setError(null)
            }
          }}
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {uploading ? 'Uploading…' : 'Upload'}
      </button>

      {/* Result */}
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          Request failed: {error}
          <p className="text-xs text-red-600 mt-1">
            A reset or network-level block (rather than an HTTP response) can look like this.
          </p>
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div
            className={`text-sm font-semibold ${
              result.status >= 200 && result.status < 300 ? 'text-green-700' : 'text-red-700'
            }`}
          >
            {result.status} {result.statusText}
          </div>
          <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap break-all text-xs text-gray-800">
            {prettify(result.body)}
          </pre>
        </div>
      )}
    </div>
  )
}
