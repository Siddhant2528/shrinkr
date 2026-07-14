"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import { domainApi } from "@/lib/api"
import { useToast } from "@/hooks/useToast"
import { Globe, Plus, Trash2, ShieldCheck, ShieldAlert, Copy, RefreshCw } from "lucide-react"

export default function CustomDomainsPage() {
    const [domains, setDomains] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [newDomain, setNewDomain] = useState("")
    const [verificationType, setVerificationType] = useState("txt")
    const [isAdding, setIsAdding] = useState(false)
    const [verifyingId, setVerifyingId] = useState(null)
    const [deletingId, setDeletingId] = useState(null)
    const [copiedToken, setCopiedToken] = useState(null)
    const { showToast } = useToast()

    useEffect(() => { fetchDomains() }, [])

    const fetchDomains = async () => {
        setIsLoading(true)
        try {
            const data = await domainApi.list()
            setDomains(Array.isArray(data) ? data : [])
        } catch {
            showToast("Failed to load domains", "error")
        } finally {
            setIsLoading(false)
        }
    }

    const handleAdd = async (e) => {
        e.preventDefault()
        if (!newDomain.trim()) return
        setIsAdding(true)
        try {
            const result = await domainApi.create(newDomain.trim(), verificationType)
            if (result.detail) { showToast(result.detail, "error"); return }
            setDomains(prev => [result, ...prev])
            setNewDomain("")
            setShowForm(false)
            showToast("Domain added! Follow the DNS instructions to verify.", "success")
        } catch {
            showToast("Failed to add domain", "error")
        } finally {
            setIsAdding(false)
        }
    }

    const handleVerify = async (domainId) => {
        setVerifyingId(domainId)
        try {
            const result = await domainApi.verify(domainId)
            if (result.detail) {
                showToast(result.detail, "error")
                return
            }
            if (result.is_verified) {
                setDomains(prev => prev.map(d => d.id === domainId ? result : d))
                showToast("Domain verified! ✅", "success")
            } else {
                showToast("DNS verification failed. Ensure the record is set and try again after propagation.", "error")
            }
        } catch {
            showToast("Verification request failed", "error")
        } finally {
            setVerifyingId(null)
        }
    }

    const handleDelete = async (domainId, domain) => {
        if (!confirm(`Remove domain "${domain}"?`)) return
        setDeletingId(domainId)
        try {
            await domainApi.delete(domainId)
            setDomains(prev => prev.filter(d => d.id !== domainId))
            showToast("Domain removed", "success")
        } catch {
            showToast("Failed to remove domain", "error")
        } finally {
            setDeletingId(null)
        }
    }

    const handleCopyToken = (token, id) => {
        navigator.clipboard.writeText(token)
        setCopiedToken(id)
        showToast("Verification token copied!", "success")
        setTimeout(() => setCopiedToken(null), 2000)
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-3xl">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                            <Globe size={24} className="text-blue-600" />
                            Custom Domains
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                            Route your shortened links through your own domain (e.g. <code className="text-blue-600 text-xs">go.company.com/slug</code>).
                        </p>
                    </div>
                    {!showForm && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Plus size={16} />
                            Add Domain
                        </button>
                    )}
                </div>

                {/* Add domain form */}
                {showForm && (
                    <div className="card p-6 animate-fadeIn">
                        <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-4">Add a Custom Domain</h2>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div>
                                <label className="label">Domain</label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={newDomain}
                                    onChange={e => setNewDomain(e.target.value)}
                                    placeholder="go.company.com"
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="label">Verification method</label>
                                <select
                                    value={verificationType}
                                    onChange={e => setVerificationType(e.target.value)}
                                    className="input"
                                >
                                    <option value="txt">DNS TXT record (recommended)</option>
                                    <option value="cname">CNAME record</option>
                                </select>
                            </div>
                            <div className="flex gap-3 justify-end">
                                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" disabled={isAdding || !newDomain.trim()} className="btn-primary">
                                    {isAdding ? "Adding…" : "Add Domain"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Domain list */}
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2].map(i => (
                            <div key={i} className="card p-5 animate-pulse">
                                <div className="h-5 bg-gray-100 dark:bg-slate-700 rounded w-1/3 mb-2" />
                                <div className="h-4 bg-gray-100 dark:bg-slate-700 rounded w-2/3" />
                            </div>
                        ))}
                    </div>
                ) : domains.length === 0 ? (
                    <div className="card p-12 text-center">
                        <Globe size={40} className="mx-auto text-gray-300 dark:text-slate-600 mb-4" />
                        <p className="text-gray-700 dark:text-slate-300 font-semibold mb-1">No custom domains yet</p>
                        <p className="text-gray-400 dark:text-slate-500 text-sm">Add a domain above to get started.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {domains.map(domain => (
                            <div key={domain.id} className="card p-5 space-y-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {domain.is_verified ? (
                                            <ShieldCheck size={20} className="text-green-500 flex-shrink-0" />
                                        ) : (
                                            <ShieldAlert size={20} className="text-amber-500 flex-shrink-0" />
                                        )}
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-900 dark:text-slate-100 truncate">{domain.domain}</p>
                                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                                                {domain.is_verified
                                                    ? `Verified ${domain.verified_at ? new Date(domain.verified_at).toLocaleDateString() : ""}`
                                                    : `Pending • ${domain.verification_type.toUpperCase()} verification`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {!domain.is_verified && (
                                            <button
                                                onClick={() => handleVerify(domain.id)}
                                                disabled={verifyingId === domain.id}
                                                className="btn-secondary flex items-center gap-1.5 !py-1.5 !px-3 !text-xs"
                                                title="Check DNS and verify"
                                            >
                                                <RefreshCw size={12} className={verifyingId === domain.id ? "animate-spin" : ""} />
                                                {verifyingId === domain.id ? "Checking…" : "Verify"}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(domain.id, domain.domain)}
                                            disabled={deletingId === domain.id}
                                            className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-all disabled:opacity-30"
                                            title="Remove domain"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>

                                {/* DNS instructions for unverified domains */}
                                {!domain.is_verified && (
                                    <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 rounded-lg p-4 space-y-2">
                                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                                            DNS Configuration Required
                                        </p>
                                        {domain.verification_type === "txt" ? (
                                            <>
                                                <p className="text-xs text-blue-600 dark:text-blue-400">
                                                    Add the following <strong>TXT</strong> record to your DNS provider:
                                                </p>
                                                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs font-mono">
                                                    <span className="text-blue-500 dark:text-blue-400 font-sans font-semibold">Name:</span>
                                                    <span className="text-gray-700 dark:text-slate-300">@ (or your subdomain)</span>
                                                    <span className="text-blue-500 dark:text-blue-400 font-sans font-semibold">Type:</span>
                                                    <span className="text-gray-700 dark:text-slate-300">TXT</span>
                                                    <span className="text-blue-500 dark:text-blue-400 font-sans font-semibold">Value:</span>
                                                    <div className="flex items-center gap-2">
                                                        <code className="text-gray-700 dark:text-slate-300 break-all">{domain.verification_token}</code>
                                                        <button
                                                            onClick={() => handleCopyToken(domain.verification_token, domain.id)}
                                                            className="text-blue-500 hover:text-blue-700 flex-shrink-0"
                                                            title="Copy token"
                                                        >
                                                            {copiedToken === domain.id ? <span className="text-green-500 text-xs">✓</span> : <Copy size={12} />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-xs text-blue-600 dark:text-blue-400">
                                                    Add the following <strong>CNAME</strong> record to your DNS provider:
                                                </p>
                                                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs font-mono">
                                                    <span className="text-blue-500 dark:text-blue-400 font-sans font-semibold">Name:</span>
                                                    <span className="text-gray-700 dark:text-slate-300">{domain.domain}</span>
                                                    <span className="text-blue-500 dark:text-blue-400 font-sans font-semibold">Type:</span>
                                                    <span className="text-gray-700 dark:text-slate-300">CNAME</span>
                                                    <span className="text-blue-500 dark:text-blue-400 font-sans font-semibold">Value:</span>
                                                    <span className="text-gray-700 dark:text-slate-300">cname.shrinkr.com</span>
                                                </div>
                                            </>
                                        )}
                                        <p className="text-xs text-blue-500 dark:text-blue-500 mt-1">
                                            DNS propagation can take up to 48 hours. Click Verify once your record is live.
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </DashboardLayout>
    )
}
