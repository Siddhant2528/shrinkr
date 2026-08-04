"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import { apiKeyApi } from "@/lib/api"
import { TableSkeleton } from "@/components/Skeletons"
import { useToast } from "@/hooks/useToast"

export default function ApiKeysPage() {
    const [keyName, setKeyName] = useState("")
    const [isCreating, setIsCreating] = useState(false)
    const [newKey, setNewKey] = useState(null)
    const [error, setError] = useState("")
    const [copied, setCopied] = useState(false)

    // Existing keys
    const [keys, setKeys] = useState([])
    const [isLoadingKeys, setIsLoadingKeys] = useState(true)
    const [revokingId, setRevokingId] = useState(null)

    const { showToast } = useToast()

    useEffect(() => {
        fetchKeys()
    }, [])

    const fetchKeys = async () => {
        try {
            const data = await apiKeyApi.list()
            if (Array.isArray(data)) {
                setKeys(data)
            } else if (data.detail) {
                showToast(data.detail, "error")
            }
        } catch (err) {
            showToast("Failed to load API keys", "error")
        } finally {
            setIsLoadingKeys(false)
        }
    }

    const handleCreate = async (e) => {
        e.preventDefault()

        if (!keyName.trim()) {
            setError("Please enter a name for your API key")
            showToast("Please enter a key name", "warning")
            return
        }

        setError("")
        setIsCreating(true)
        setNewKey(null)

        try {
            const data = await apiKeyApi.create(keyName.trim())

            if (data.detail) {
                setError(data.detail)
                showToast(data.detail, "error")
                return
            }

            setNewKey(data)
            setKeyName("")
            showToast("API Key generated successfully!", "success")
            fetchKeys()

        } catch (err) {
            setError("Failed to create API key")
            showToast("Failed to generate API Key", "error")
        } finally {
            setIsCreating(false)
        }
    }

    const handleRevoke = async (keyId, name) => {
        if (!confirm(`Revoke API key "${name}"? This cannot be undone.`)) return

        setRevokingId(keyId)
        try {
            await apiKeyApi.revoke(keyId)
            setKeys(prev =>
                prev.map(k =>
                    k.id === keyId ? { ...k, is_active: false } : k
                )
            )
            showToast(`API Key "${name}" revoked!`, "success")
        } catch (err) {
            showToast("Failed to revoke API key", "error")
        } finally {
            setRevokingId(null)
        }
    }

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(newKey.key)
            setCopied(true)
            showToast("API Key copied to clipboard!", "success")
            setTimeout(() => setCopied(false), 3000)
        } catch (err) {
            showToast("Failed to copy API key", "error")
        }
    }

    const handleDismiss = () => {
        setNewKey(null)
        setCopied(false)
    }

    const activeKeys = keys.filter(k => k.is_active)
    const revokedKeys = keys.filter(k => !k.is_active)

    return (
        <DashboardLayout>
            <div className="max-w-2xl space-y-6">

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Generate keys to access the Shrinkr API programmatically
                    </p>
                </div>

                {/* New key alert — shown immediately after creation */}
                {newKey && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 animate-fadeIn">
                        <div className="flex items-start gap-3 mb-4">
                            <span className="text-xl">⚠️</span>
                            <div>
                                <p className="font-semibold text-amber-800">
                                    Save your API key now
                                </p>
                                <p className="text-sm text-amber-700 mt-0.5">
                                    This key will only be shown once.
                                    You cannot view it again after closing this message.
                                </p>
                            </div>
                        </div>

                        {/* Key display */}
                        <div className="bg-white border border-amber-200 rounded-xl p-3 flex items-center gap-3 mb-4">
                            <code className="flex-1 text-sm font-mono text-gray-800 break-all select-all">
                                {newKey.key}
                            </code>
                            <button
                                onClick={handleCopy}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 flex-shrink-0 cursor-pointer ${copied
                                        ? "bg-green-500 text-white"
                                        : "bg-amber-100 text-amber-800 hover:bg-amber-200"
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

                        {/* Key metadata */}
                        <div className="flex items-center justify-between">
                            <div className="text-xs text-amber-600 space-y-0.5">
                                <p>Name: <span className="font-semibold">{newKey.name}</span></p>
                                <p>Created: <span className="font-semibold">
                                    {new Date(newKey.created_at).toLocaleDateString("en-GB")}
                                </span></p>
                            </div>
                            <button
                                onClick={handleDismiss}
                                className="text-sm text-amber-700 hover:text-amber-900 font-semibold cursor-pointer border-none bg-none"
                            >
                                I've saved it →
                            </button>
                        </div>
                    </div>
                )}

                {/* Create new key form */}
                <div className="card p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-1">
                        Create new API key
                    </h2>
                    <p className="text-sm text-gray-400 mb-5">
                        Give your key a descriptive name so you know what it's used for.
                    </p>

                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="label">Key name</label>
                            <input
                                type="text"
                                value={keyName}
                                onChange={(e) => setKeyName(e.target.value)}
                                placeholder="e.g. Production app, Portfolio site, CI/CD pipeline"
                                className="input"
                                disabled={isCreating}
                            />
                        </div>

                        {error && (
                            <p className="text-red-500 text-sm">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={isCreating || !keyName.trim()}
                            className="btn-primary cursor-pointer"
                        >
                            {isCreating ? "Generating..." : "+ Generate API Key"}
                        </button>
                    </form>
                </div>

                {/* Existing keys list */}
                <div className="card p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-1">
                        Your API keys
                    </h2>
                    <p className="text-sm text-gray-400 mb-5">
                        {activeKeys.length} active key{activeKeys.length !== 1 ? "s" : ""}
                    </p>

                    {isLoadingKeys ? (
                        <TableSkeleton cols={2} rows={2} />
                    ) : keys.length === 0 ? (
                        <div className="text-center py-8 flex flex-col items-center justify-center">
                            <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-2xl mb-3">
                                🔑
                            </div>
                            <p className="text-gray-700 font-bold text-sm">No API keys generated</p>
                            <p className="text-gray-400 text-xs mt-1 max-w-xs">
                                Create your first credential key above to build programmatic integrations with our URL shortening routes.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Active keys */}
                            {activeKeys.map((key) => (
                                <div
                                    key={key.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100/50 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-semibold text-gray-900">
                                                {key.name}
                                            </p>
                                            <span className="badge-active py-0.5 px-2">
                                                Active
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Created {new Date(key.created_at).toLocaleDateString("en-GB")}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleRevoke(key.id, key.name)}
                                        disabled={revokingId === key.id}
                                        className="text-xs text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all font-semibold disabled:opacity-50 cursor-pointer bg-white"
                                    >
                                        {revokingId === key.id ? "Revoking..." : "Revoke"}
                                    </button>
                                </div>
                            ))}

                            {/* Revoked keys */}
                            {revokedKeys.length > 0 && (
                                <>
                                    <div className="pt-3 mt-3 border-t border-gray-100">
                                        <p className="text-xs font-semibold text-gray-400 mb-2">
                                            Revoked Keys ({revokedKeys.length})
                                        </p>
                                    </div>
                                    {revokedKeys.map((key) => (
                                        <div
                                            key={key.id}
                                            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 opacity-60"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium text-gray-500 line-through">
                                                        {key.name}
                                                    </p>
                                                    <span className="badge-inactive py-0.5 px-2">
                                                        Revoked
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Created {new Date(key.created_at).toLocaleDateString("en-GB")}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}