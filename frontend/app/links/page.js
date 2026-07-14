"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import DashboardLayout from "@/components/DashboardLayout"
import { urlApi, tagApi } from "@/lib/api"
import { API_URL } from "@/lib/constants"
import { TableSkeleton } from "@/components/Skeletons"
import { useToast } from "@/hooks/useToast"
import TagManager, { TagBadge } from "@/components/TagManager"
import {
    Star, Archive, BarChart2, QrCode, Pencil, ChevronLeft, ChevronRight,
    ArchiveRestore, Tag
} from "lucide-react"

const LIMIT = 50

export default function LinksPage() {
    const [data, setData] = useState({ items: [], total_items: 0, page: 1, total_pages: 1, limit: LIMIT })
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")
    const [searchQuery, setSearchQuery] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")
    const [copiedCode, setCopiedCode] = useState(null)
    const [archivingCode, setArchivingCode] = useState(null)
    const [editingLink, setEditingLink] = useState(null)
    const [editUrl, setEditUrl] = useState("")
    const [editTagIds, setEditTagIds] = useState([])
    const [sortBy, setSortBy] = useState("newest")
    const [page, setPage] = useState(1)
    const [showArchived, setShowArchived] = useState(false)
    const [favoritesOnly, setFavoritesOnly] = useState(false)
    const [activeTagId, setActiveTagId] = useState(null)
    const [userTags, setUserTags] = useState([])
    const [togglingFav, setTogglingFav] = useState(null)

    const { showToast } = useToast()

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery)
            setPage(1)  // reset to page 1 on new search
        }, 400)
        return () => clearTimeout(timer)
    }, [searchQuery])

    const fetchLinks = useCallback(async () => {
        setIsLoading(true)
        try {
            const result = await urlApi.myLinks({
                page,
                limit: LIMIT,
                search: debouncedSearch || undefined,
                tagId: activeTagId,
                showArchived,
                favoritesOnly,
                sortBy,
            })
            if (result.detail) {
                setError(result.detail)
                showToast(result.detail, "error")
                return
            }
            setData(result)
        } catch {
            setError("Failed to load links")
            showToast("Failed to load links", "error")
        } finally {
            setIsLoading(false)
        }
    }, [page, debouncedSearch, activeTagId, showArchived, favoritesOnly, sortBy])

    useEffect(() => {
        fetchLinks()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchLinks])

    // Load user tags for filter sidebar
    useEffect(() => {
        tagApi.list().then(t => setUserTags(Array.isArray(t) ? t : []))
    }, [])

    const handleCopy = async (shortUrl, shortCode) => {
        try {
            await navigator.clipboard.writeText(shortUrl)
            setCopiedCode(shortCode)
            showToast("Short URL copied to clipboard!", "success")
            setTimeout(() => setCopiedCode(null), 2000)
        } catch {
            showToast("Failed to copy URL", "error")
        }
    }

    const handleArchive = async (shortCode, isCurrentlyArchived) => {
        const actionText = isCurrentlyArchived ? "Restore" : "Archive"
        if (!confirm(`${actionText} link "/${shortCode}"?${isCurrentlyArchived ? "" : " It will stop redirecting and be hidden from your main list."}`)) return
        setArchivingCode(shortCode)
        try {
            const updated = await urlApi.archiveLink(shortCode)
            if (updated.detail) { showToast(updated.detail, "error"); return }
            setData(prev => ({
                ...prev,
                items: showArchived
                    ? prev.items.map(l => l.short_code === shortCode ? updated : l)
                    : prev.items.filter(l => l.short_code !== shortCode),
            }))
            showToast(isCurrentlyArchived ? "Link restored." : "Link archived.", "success")
        } catch {
            showToast(`Failed to ${isCurrentlyArchived ? "restore" : "archive"} link`, "error")
        } finally {
            setArchivingCode(null)
        }
    }

    const handleToggleFavorite = async (shortCode) => {
        setTogglingFav(shortCode)
        try {
            const updated = await urlApi.toggleFavorite(shortCode)
            setData(prev => ({
                ...prev,
                items: favoritesOnly && !updated.is_favorite
                    ? prev.items.filter(l => l.short_code !== shortCode)
                    : prev.items.map(l => l.short_code === shortCode ? updated : l),
            }))
        } catch {
            showToast("Failed to update favorite", "error")
        } finally {
            setTogglingFav(null)
        }
    }

    const handleEditSave = async () => {
        if (!editUrl) return
        try {
            const updated = await urlApi.updateLink(editingLink.short_code, editUrl)
            if (updated.detail) { showToast(updated.detail, "error"); return }

            // Also sync tags
            if (editTagIds !== null) {
                const { tagApi: tApi } = await import("@/lib/api")
                await tApi.setLinkTags(editingLink.short_code, editTagIds)
            }

            await fetchLinks()
            showToast("Link updated!", "success")
            setEditingLink(null)
            setEditUrl("")
            setEditTagIds([])
        } catch {
            showToast("Failed to update link", "error")
        }
    }

    const handleFilterReset = () => {
        setPage(1)
        setSearchQuery("")
        setActiveTagId(null)
        setShowArchived(false)
        setFavoritesOnly(false)
        setSortBy("newest")
    }

    const links = data.items || []

    // ─── Loading skeleton ───────────────────────────────────────────────────────
    if (isLoading && page === 1 && !debouncedSearch) {
        return (
            <DashboardLayout>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-1/4 animate-pulse" />
                        <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded w-24 animate-pulse" />
                    </div>
                    <TableSkeleton cols={6} rows={8} />
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">

                {/* ── Header ── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">My Links</h1>
                        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
                            {data.total_items} link{data.total_items !== 1 ? "s" : ""} total
                        </p>
                    </div>
                    <a href="/"
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer">
                        + New Link
                    </a>
                </div>

                {/* ── Filter bar ── */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1 w-full">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                        <input
                            id="links-search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by slug or URL..."
                            className="w-full border border-gray-200 dark:border-slate-600 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-900 dark:text-slate-100 dark:bg-slate-700 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>

                    {/* Sort */}
                    <select
                        value={sortBy}
                        onChange={(e) => { setSortBy(e.target.value); setPage(1) }}
                        className="border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-gray-700 dark:text-slate-300 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-auto"
                    >
                        <option value="newest">Newest first</option>
                        <option value="oldest">Oldest first</option>
                        <option value="clicks">Most clicks</option>
                    </select>

                    {/* Favorites toggle */}
                    <button
                        onClick={() => { setFavoritesOnly(!favoritesOnly); setPage(1) }}
                        title="Favorites only"
                        className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${favoritesOnly
                            ? "bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800"
                            : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600 dark:hover:bg-slate-600"
                        }`}
                    >
                        <Star size={14} fill={favoritesOnly ? "currentColor" : "none"} />
                        <span className="hidden sm:inline">Favorites</span>
                    </button>

                    {/* Archived toggle */}
                    <button
                        onClick={() => { setShowArchived(!showArchived); setPage(1) }}
                        title="Show archived"
                        className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${showArchived
                            ? "bg-gray-100 text-gray-700 border-gray-300 dark:bg-slate-600 dark:text-slate-200 dark:border-slate-500"
                            : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600 dark:hover:bg-slate-600"
                        }`}
                    >
                        <Archive size={14} />
                        <span className="hidden sm:inline">Archived</span>
                    </button>
                </div>

                {/* ── Tag filter pills ── */}
                {userTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-xs text-gray-400 dark:text-slate-500 font-medium uppercase tracking-wider">Filter by tag:</span>
                        <button
                            onClick={() => { setActiveTagId(null); setPage(1) }}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${activeTagId === null ? "border-blue-400 bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400" : "border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:border-gray-300"}`}
                        >
                            All
                        </button>
                        {userTags.map(tag => (
                            <button
                                key={tag.id}
                                onClick={() => { setActiveTagId(activeTagId === tag.id ? null : tag.id); setPage(1) }}
                                className="transition-all"
                                style={{ opacity: activeTagId === null || activeTagId === tag.id ? 1 : 0.5 }}
                            >
                                <TagBadge tag={tag} />
                            </button>
                        ))}
                    </div>
                )}

                {/* ── Error ── */}
                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* ── Links table ── */}
                {links.length === 0 ? (
                    <div className="card p-12 text-center flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950 rounded-2xl flex items-center justify-center text-3xl mb-4 text-blue-500">
                            🔗
                        </div>
                        <p className="text-gray-700 dark:text-slate-300 font-bold text-lg mb-1">
                            {debouncedSearch ? "No search results" : showArchived ? "No archived links" : favoritesOnly ? "No favourites yet" : "Your link list is empty"}
                        </p>
                        <p className="text-gray-400 dark:text-slate-500 text-sm max-w-sm mb-6 leading-relaxed">
                            {debouncedSearch
                                ? "We couldn't find any links matching your search query."
                                : "Start shortening long URLs to track clicks, device demographics, and geolocation analytics."}
                        </p>
                        {!debouncedSearch && !showArchived && !favoritesOnly && (
                            <a href="/"
                                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all px-6 py-2.5 rounded-xl text-sm font-semibold cursor-pointer">
                                Shorten Your First URL
                            </a>
                        )}
                        {(debouncedSearch || showArchived || favoritesOnly || activeTagId) && (
                            <button onClick={handleFilterReset} className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
                                        <th className="text-left text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-6 py-3.5">Short Link</th>
                                        <th className="text-left text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-6 py-3.5 hidden md:table-cell">Destination</th>
                                        <th className="text-left text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-6 py-3.5 hidden lg:table-cell">Tags</th>
                                        <th className="text-right text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-6 py-3.5">Clicks</th>
                                        <th className="text-left text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-6 py-3.5 hidden sm:table-cell">Status</th>
                                        <th className="text-left text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-6 py-3.5 hidden lg:table-cell">Created</th>
                                        <th className="text-right text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-6 py-3.5">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                                    {links.map((link) => (
                                        <tr key={link.short_code}
                                            className={`hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors ${link.is_archived ? "opacity-60" : ""}`}>

                                            {/* Short code */}
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    {/* Favorite star */}
                                                    <button
                                                        onClick={() => handleToggleFavorite(link.short_code)}
                                                        disabled={togglingFav === link.short_code}
                                                        className={`transition-all tooltip-trigger p-1 rounded-lg ${link.is_favorite ? "text-amber-500 dark:text-amber-400" : "text-gray-300 dark:text-slate-600 hover:text-amber-500 dark:hover:text-amber-400"}`}
                                                        data-tooltip={link.is_favorite ? "Remove from Favorites" : "Add to Favorites"}
                                                    >
                                                        <Star size={18} fill={link.is_favorite ? "currentColor" : "none"} className="transition-transform duration-150 hover:scale-110 active:scale-125" />
                                                    </button>
                                                    <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                                                        /{link.short_code}
                                                    </span>
                                                    <button
                                                        onClick={() => handleCopy(link.short_url, link.short_code)}
                                                        className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1 tooltip-trigger"
                                                        data-tooltip={copiedCode === link.short_code ? "Copied!" : "Copy short URL"}
                                                    >
                                                        {copiedCode === link.short_code ? (
                                                            <span className="text-green-500 font-bold text-xs">✓</span>
                                                        ) : (
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Original URL */}
                                            <td className="px-6 py-5 hidden md:table-cell">
                                                <p className="text-sm text-gray-600 dark:text-slate-400 truncate max-w-xs" title={link.original_url}>
                                                    {link.original_url}
                                                </p>
                                            </td>

                                            {/* Tags */}
                                            <td className="px-6 py-5 hidden lg:table-cell">
                                                <div className="flex flex-wrap gap-1">
                                                    {link.tags?.map(tag => (
                                                        <TagBadge key={tag.id} tag={tag} />
                                                    ))}
                                                </div>
                                            </td>

                                            {/* Clicks */}
                                            <td className="px-6 py-5 text-right">
                                                <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                                                    {link.clicks.toLocaleString()}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-5 hidden sm:table-cell">
                                                {link.is_archived ? (
                                                    <span className="badge-archived">Archived</span>
                                                ) : link.is_active ? (
                                                    <span className="badge-active">Active</span>
                                                ) : (
                                                    <span className="badge-inactive">Inactive</span>
                                                )}
                                            </td>

                                            {/* Created */}
                                            <td className="px-6 py-5 hidden lg:table-cell text-sm text-gray-500 dark:text-slate-500">
                                                {new Date(link.created_at).toLocaleDateString()}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Link href={`/analytics/${link.short_code}`}
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 transition-all tooltip-trigger"
                                                        data-tooltip="Analytics">
                                                        <BarChart2 size={15} />
                                                    </Link>
                                                    <a href={`${API_URL}/qr/${link.short_code}`}
                                                        target="_blank" rel="noopener noreferrer"
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 transition-all tooltip-trigger"
                                                        data-tooltip="QR Code">
                                                        <QrCode size={15} />
                                                    </a>
                                                    <button
                                                        onClick={() => { setEditingLink(link); setEditUrl(link.original_url); setEditTagIds(link.tags?.map(t => t.id) || []) }}
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 transition-all tooltip-trigger"
                                                        data-tooltip="Edit Link">
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleArchive(link.short_code, link.is_archived)}
                                                        disabled={archivingCode === link.short_code}
                                                        className={`p-1.5 rounded-lg transition-all disabled:opacity-30 tooltip-trigger ${
                                                            link.is_archived
                                                                ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                                                : "text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                                                        }`}
                                                        data-tooltip={link.is_archived ? "Restore" : "Archive"}
                                                    >
                                                        {link.is_archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* ── Pagination ── */}
                        {data.total_pages > 1 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-slate-700">
                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                    Showing <span className="font-medium text-gray-700 dark:text-slate-300">{((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, data.total_items)}</span> of <span className="font-medium text-gray-700 dark:text-slate-300">{data.total_items}</span>
                                </p>
                                <div className="flex items-center gap-1">
                                    <button
                                        id="pagination-prev"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1 || isLoading}
                                        className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        title="Previous page"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span className="text-sm text-gray-600 dark:text-slate-400 px-2">
                                        Page <span className="font-semibold text-gray-900 dark:text-slate-100">{page}</span> of <span className="font-semibold text-gray-900 dark:text-slate-100">{data.total_pages}</span>
                                    </span>
                                    <button
                                        id="pagination-next"
                                        onClick={() => setPage(p => Math.min(data.total_pages, p + 1))}
                                        disabled={page === data.total_pages || isLoading}
                                        className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        title="Next page"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Edit Modal ── */}
                {editingLink && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 relative">
                            <button
                                onClick={() => { setEditingLink(null); setEditUrl(""); setEditTagIds([]) }}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 p-1 border-none bg-none cursor-pointer"
                            >
                                ✕
                            </button>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-1">
                                Edit Link
                            </h2>
                            <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">
                                /{editingLink.short_code}
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="label">Destination URL</label>
                                    <input
                                        type="url"
                                        value={editUrl}
                                        onChange={(e) => setEditUrl(e.target.value)}
                                        className="input"
                                        placeholder="https://example.com"
                                    />
                                </div>

                                <div>
                                    <label className="label flex items-center gap-1.5">
                                        <Tag size={12} /> Tags
                                    </label>
                                    <div className="p-3 border border-gray-100 dark:border-slate-700 rounded-lg">
                                        <TagManager
                                            selectedIds={editTagIds}
                                            onSelectionChange={setEditTagIds}
                                            showCreateForm={true}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <button onClick={() => { setEditingLink(null); setEditUrl(""); setEditTagIds([]) }} className="btn-secondary">
                                        Cancel
                                    </button>
                                    <button onClick={handleEditSave} className="btn-primary">
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </DashboardLayout>
    )
}