"use client"

import { useState } from "react"
import { urlApi } from "@/lib/api"
import { useToast, formatErrorMessage } from "@/hooks/useToast"

export default function ShortenForm() {
    const [url, setUrl] = useState("")
    const [customSlug, setCustomSlug] = useState("")
    const [expiryDays, setExpiryDays] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState("")
    const [copied, setCopied] = useState(false)
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [showQr, setShowQr] = useState(false)
    const [qrCopied, setQrCopied] = useState(false)
    
    const { showToast } = useToast()

    const handleShorten = async () => {
        if (!url) {
            setError("Please enter a URL")
            showToast("Please enter a URL", "warning")
            return
        }

        setError("")
        setResult(null)
        setShowQr(false)
        setIsLoading(true)

        let targetUrl = url.trim()
        if (targetUrl && !/^https?:\/\//i.test(targetUrl)) {
            targetUrl = `https://${targetUrl}`
        }

        try {
            const data = await urlApi.shorten(
                targetUrl,
                customSlug || null,
                expiryDays ? parseInt(expiryDays) : null
            )

            if (data.detail) {
                const errMsg = formatErrorMessage(data.detail)
                setError(errMsg)
                showToast(errMsg, "error")
                return
            }

            setResult(data)
            setUrl("")
            setCustomSlug("")
            setExpiryDays("")
            showToast("Shortened URL created!", "success")

        } catch (err) {
            setError("Network error — please try again")
            showToast("Network error occurred", "error")
        } finally {
            setIsLoading(false)
        }
    }

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(result.short_url)
            setCopied(true)
            showToast("Short URL copied!", "success")
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            showToast("Failed to copy URL", "error")
        }
    }

    const handleDownloadQr = async () => {
        try {
            const qrUrl = urlApi.getQr(result.short_code)
            const response = await fetch(qrUrl)
            const blob = await response.blob()
            const blobUrl = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = blobUrl
            link.download = `qr-${result.short_code}.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(blobUrl)
            showToast("QR Code download started!", "success")
        } catch (err) {
            console.error("Failed to download QR code", err)
            showToast("Failed to download QR code", "error")
        }
    }

    const handleShareQr = async () => {
        const qrUrl = urlApi.getQr(result.short_code)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "QR Code",
                    text: `QR Code for ${result.short_url}`,
                    url: qrUrl,
                })
            } catch (err) {
                if (err.name !== "AbortError") {
                    console.error("Error sharing", err)
                }
            }
        } else {
            try {
                await navigator.clipboard.writeText(qrUrl)
                setQrCopied(true)
                showToast("QR Code link copied!", "success")
                setTimeout(() => setQrCopied(false), 2000)
            } catch (err) {
                showToast("Failed to copy QR link", "error")
            }
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleShorten()
    }

    return (
        <div className="w-full">
            <div className="space-y-3">

                {/* Row 1: URL input */}
                <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Paste a long URL to shorten..."
                    className="input w-full dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500"
                    disabled={isLoading}
                />

                {/* Row 2: Advanced options toggle */}
                <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
                >
                    <svg
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${showAdvanced ? "rotate-90" : ""}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    ⚙ Advanced Options
                </button>

                {/* Advanced options */}
                {showAdvanced && (
                    <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-gray-100 dark:border-zinc-700">
                        <div>
                            <label className="label dark:text-zinc-400">Custom slug (optional)</label>
                            <input
                                type="text"
                                value={customSlug}
                                onChange={(e) => setCustomSlug(e.target.value)}
                                placeholder="my-custom-slug"
                                className="input dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500"
                            />
                        </div>
                        <div>
                            <label className="label dark:text-zinc-400">Expires in (days)</label>
                            <input
                                type="number"
                                value={expiryDays}
                                onChange={(e) => setExpiryDays(e.target.value)}
                                placeholder="7"
                                min="1"
                                className="input dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500"
                            />
                        </div>
                    </div>
                )}

                {/* Row 3: Full-width large action button */}
                <button
                    onClick={handleShorten}
                    disabled={isLoading || !url}
                    className="mt-3 w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10"
                                    stroke="currentColor" strokeWidth="4" fill="none"/>
                                <path className="opacity-75" fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                            Shortening...
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            Shorten URL
                        </>
                    )}
                </button>

                {/* Error message */}
                {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg mb-3">
                        <span className="text-red-500">⚠️</span>
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}

                {/* Success result */}
                {result && (
                    <div className="p-4 bg-green-50 border border-green-100 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-green-700">
                                ✅ Link shortened successfully
                            </p>
                            <span className="text-xs text-gray-400">
                                {new Date(result.created_at).toLocaleDateString()}
                            </span>
                        </div>

                        {/* Short URL display */}
                        <div className="flex items-center gap-2 bg-white rounded-lg p-3 border border-green-200">
                            <a
                                href={result.short_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 text-blue-600 font-mono text-sm font-medium hover:underline truncate"
                            >
                                {result.short_url}
                            </a>
                            <button
                                onClick={handleCopy}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                                    copied
                                        ? "bg-green-500 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                            >
                                {copied ? (
                                    <span>✓ Copied!</span>
                                ) : (
                                    <>
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                        </svg>
                                        <span>Copy</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* QR Code Toggle */}
                        <div className="flex items-center gap-3 mt-3">
                            <button
                                onClick={() => setShowQr(!showQr)}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 bg-none border-none cursor-pointer"
                            >
                                {showQr ? "📱 Hide QR Code" : "📱 View QR Code"}
                            </button>
                            <span className="text-gray-200">|</span>
                            <span className="text-xs text-gray-400">
                                Code: <span className="font-mono">{result.short_code}</span>
                            </span>
                        </div>

                        {/* Inline QR Code display */}
                        {showQr && (
                            <div className="mt-4 p-4 bg-white border border-gray-150 rounded-lg flex flex-col sm:flex-row items-center gap-4 shadow-sm animate-fadeIn">
                                <img
                                    src={urlApi.getQr(result.short_code)}
                                    alt="QR Code"
                                    className="w-28 h-28 border border-gray-100 rounded-lg p-2 bg-white flex-shrink-0"
                                />
                                <div className="flex-1 flex flex-col justify-center w-full">
                                    <h4 className="text-xs font-semibold text-gray-900 mb-0.5">
                                        QR Code for your link
                                    </h4>
                                    <p className="text-xs text-gray-500 mb-3 truncate max-w-xs">
                                        {result.short_url}
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleDownloadQr}
                                            className="btn-secondary text-xs flex-1 flex items-center justify-center gap-1 py-1.5 px-3"
                                        >
                                            ⬇️ Download
                                        </button>
                                        <button
                                            onClick={handleShareQr}
                                            className="btn-secondary text-xs flex-1 flex items-center justify-center gap-1 py-1.5 px-3"
                                        >
                                            {qrCopied ? "✓ Copied!" : "🔗 Copy Link"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}