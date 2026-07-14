"use client"

import { useState, useEffect } from "react"
import { tagApi } from "@/lib/api"
import { X, Plus, Tag } from "lucide-react"

const PRESET_COLORS = [
    "#6366f1", "#3b82f6", "#10b981", "#f59e0b",
    "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6",
]

/**
 * TagManager — displays a list of user tags, allows create/delete,
 * and optionally lets you pick which tags are applied to a link.
 *
 * Props:
 *   selectedIds: number[]        — currently selected tag IDs (for link editing)
 *   onSelectionChange: (ids) => void  — called when selection changes
 *   showCreateForm: boolean      — whether to show the inline create form
 */
export default function TagManager({ selectedIds = [], onSelectionChange, showCreateForm = true }) {
    const [tags, setTags] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [newName, setNewName] = useState("")
    const [newColor, setNewColor] = useState(PRESET_COLORS[0])
    const [isCreating, setIsCreating] = useState(false)
    const [showForm, setShowForm] = useState(false)

    useEffect(() => {
        loadTags()
    }, [])

    const loadTags = async () => {
        try {
            const data = await tagApi.list()
            setTags(Array.isArray(data) ? data : [])
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreate = async (e) => {
        e.preventDefault()
        if (!newName.trim()) return
        setIsCreating(true)
        try {
            const tag = await tagApi.create(newName.trim(), newColor)
            if (tag.id) {
                setTags(prev => [...prev, tag])
                setNewName("")
                setShowForm(false)
            }
        } finally {
            setIsCreating(false)
        }
    }

    const handleDelete = async (tagId) => {
        await tagApi.delete(tagId)
        setTags(prev => prev.filter(t => t.id !== tagId))
        if (onSelectionChange) {
            onSelectionChange(selectedIds.filter(id => id !== tagId))
        }
    }

    const toggleSelection = (tagId) => {
        if (!onSelectionChange) return
        if (selectedIds.includes(tagId)) {
            onSelectionChange(selectedIds.filter(id => id !== tagId))
        } else {
            onSelectionChange([...selectedIds, tagId])
        }
    }

    if (isLoading) {
        return (
            <div className="flex gap-2 flex-wrap">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-6 w-16 bg-gray-100 dark:bg-slate-700 rounded-full animate-pulse" />
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {/* Tag pills */}
            <div className="flex flex-wrap gap-2">
                {tags.map(tag => {
                    const isSelected = selectedIds.includes(tag.id)
                    return (
                        <div
                            key={tag.id}
                            className={`
                                group flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer
                                transition-all border-2
                                ${isSelected
                                    ? "opacity-100 scale-105"
                                    : "opacity-70 hover:opacity-100 border-transparent"
                                }
                            `}
                            style={{
                                backgroundColor: `${tag.color}22`,
                                color: tag.color,
                                borderColor: isSelected ? tag.color : "transparent",
                            }}
                            onClick={() => toggleSelection(tag.id)}
                        >
                            <Tag size={10} />
                            <span>{tag.name}</span>
                            {onSelectionChange === undefined && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(tag.id) }}
                                    className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                                    title="Delete tag"
                                >
                                    <X size={10} />
                                </button>
                            )}
                        </div>
                    )
                })}

                {tags.length === 0 && (
                    <p className="text-xs text-gray-400 dark:text-slate-500 italic">No tags yet</p>
                )}
            </div>

            {/* Create form */}
            {showCreateForm && (
                showForm ? (
                    <form onSubmit={handleCreate} className="flex items-center gap-2">
                        <input
                            autoFocus
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            placeholder="Tag name..."
                            className="input !py-1.5 !text-xs flex-1"
                            maxLength={30}
                        />
                        {/* Color swatches */}
                        <div className="flex gap-1">
                            {PRESET_COLORS.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setNewColor(c)}
                                    className={`w-5 h-5 rounded-full border-2 transition-transform ${newColor === c ? "scale-125 border-gray-900 dark:border-white" : "border-transparent hover:scale-110"}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                        <button type="submit" disabled={isCreating || !newName.trim()} className="btn-primary !py-1.5 !px-3 !text-xs">
                            {isCreating ? "…" : "Add"}
                        </button>
                        <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
                            <X size={14} />
                        </button>
                    </form>
                ) : (
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400 transition-colors"
                    >
                        <Plus size={12} />
                        <span>New tag</span>
                    </button>
                )
            )}
        </div>
    )
}

/**
 * Compact tag badge — just renders a single tag pill for display inside table rows.
 */
export function TagBadge({ tag }) {
    return (
        <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: `${tag.color}22`, color: tag.color }}
        >
            {tag.name}
        </span>
    )
}
