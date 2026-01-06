'use client'

import { useState } from 'react'

export default function TestImagePage() {
  const [prompt, setPrompt] = useState('Create a picture of a nano banana dish in a fancy restaurant with a Gemini theme')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ text?: string; imageUrl?: string; error?: string } | null>(null)

  const generateImage = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/test-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({ error: error.message || 'Failed to generate' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Gemini Image Generation Test</h1>
        <p className="text-gray-400 mb-6">Testing gemini-2.5-flash-image model</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-32 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your image prompt..."
            />
          </div>

          <button
            onClick={generateImage}
            disabled={loading || !prompt.trim()}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating...
              </span>
            ) : (
              'Generate Image'
            )}
          </button>
        </div>

        {result && (
          <div className="mt-8 space-y-4">
            {result.error && (
              <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg">
                <h3 className="font-medium text-red-400 mb-1">Error</h3>
                <p className="text-red-300 text-sm">{result.error}</p>
              </div>
            )}

            {result.text && (
              <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
                <h3 className="font-medium text-gray-300 mb-2">Text Response</h3>
                <p className="text-gray-400 text-sm whitespace-pre-wrap">{result.text}</p>
              </div>
            )}

            {result.imageUrl && (
              <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
                <h3 className="font-medium text-gray-300 mb-3">Generated Image</h3>
                <img
                  src={result.imageUrl}
                  alt="Generated image"
                  className="w-full rounded-lg shadow-lg"
                />
                <div className="mt-3 flex gap-2">
                  <a
                    href={result.imageUrl}
                    download="gemini-generated-image.png"
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Download Image
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
          <h3 className="font-medium text-gray-300 mb-2">API Details</h3>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Model: <code className="bg-gray-700 px-1 rounded">gemini-2.5-flash-image</code></li>
            <li>• Endpoint: <code className="bg-gray-700 px-1 rounded">/api/test-image</code></li>
            <li>• SDK: <code className="bg-gray-700 px-1 rounded">@google/genai</code></li>
          </ul>
        </div>
      </div>
    </div>
  )
}
