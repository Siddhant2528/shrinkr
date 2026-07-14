"use client"

import { useEffect, useState } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import { urlApi } from "@/lib/api"
import Link from "next/link"

export default function AnalyticsIndexPage() {
    const [links, setLinks] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchLinks = async () => {
            try {
                const data = await urlApi.myLinks()
                setLinks(data && Array.isArray(data.items) ? data.items : [])
            } catch (err) {
                console.error(err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchLinks()
    }, [])

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-100 rounded w-1/4"/>
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-100 rounded-xl"/>
                    ))}
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Select a link to view its analytics
                    </p>
                </div>

                {links.length === 0 ? (
                    <div className="card p-12 text-center">
                        <p className="text-4xl mb-4">📊</p>
                        <p className="text-gray-600 font-medium mb-2">No links yet</p>
                        <p className="text-gray-400 text-sm mb-6">
                            Create a short link first to see analytics
                        </p>
                        <Link href="/"
                            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                            Create a link
                        </Link>
                    </div>
                ) : (
                    <div className="card divide-y divide-gray-50">
                        {links.map((link) => (
                            <Link
                                key={link.short_code}
                                href={`/analytics/${link.short_code}`}
                                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="font-mono text-sm font-medium text-blue-600">
                                        /{link.short_code}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate mt-0.5">
                                        {link.original_url}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4 ml-4">
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-gray-900">
                                            {link.clicks}
                                        </p>
                                        <p className="text-xs text-gray-400">clicks</p>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                        link.is_active
                                            ? "bg-green-50 text-green-700"
                                            : "bg-red-50 text-red-600"
                                    }`}>
                                        {link.is_active ? "Active" : "Inactive"}
                                    </span>
                                    <span className="text-gray-300 text-sm">→</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
