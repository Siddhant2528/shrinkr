"use client"

import { useEffect, useState } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import DashboardNav from "@/components/DashboardNav"
import { dashboardApi } from "@/lib/api"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { TableSkeleton } from "@/components/Skeletons"

export default function TopLinksPage() {
    const [links, setLinks] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")
    const router = useRouter()

    useEffect(() => {
        const fetchTopLinks = async () => {
            try {
                const data = await dashboardApi.getTopLinks()

                if (data.detail && data.detail.includes("Admin")) {
                    router.push("/dashboard")
                    return
                }

                if (data.detail) {
                    setError(data.detail)
                    return
                }

                setLinks(Array.isArray(data) ? data : [])
            } catch (err) {
                setError("Failed to load top links")
            } finally {
                setIsLoading(false)
            }
        }

        fetchTopLinks()
    }, [router])

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Detailed overview of shortened links performance
                    </p>
                </div>

                <DashboardNav isPersonal={false} />

                <div className="card p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-6">
                        Top Performing Links
                    </h2>

                    {isLoading ? (
                        <TableSkeleton cols={5} rows={5} />
                    ) : error ? (
                        <p className="text-red-500 text-sm text-center py-6">{error}</p>
                    ) : links.length === 0 ? (
                        <div className="text-center py-8 flex flex-col items-center justify-center">
                            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-xl mb-3">
                                📊
                            </div>
                            <p className="text-gray-500 text-sm">No click tracking logs yet</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-500">
                                <thead className="text-xs text-gray-400 uppercase border-b border-gray-100">
                                    <tr>
                                        <th className="py-3 px-4 font-semibold">Rank</th>
                                        <th className="py-3 px-4 font-semibold">Short Link</th>
                                        <th className="py-3 px-4 font-semibold">Original URL</th>
                                        <th className="py-3 px-4 font-semibold text-right">Clicks</th>
                                        <th className="py-3 px-4 font-semibold text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {links.map((link, index) => (
                                        <tr key={link.short_code} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="py-4 px-4 font-bold text-gray-400">
                                                #{index + 1}
                                            </td>
                                            <td className="py-4 px-4 font-mono font-medium text-blue-600">
                                                /{link.short_code}
                                            </td>
                                            <td className="py-4 px-4 truncate max-w-xs text-gray-600">
                                                {link.original_url}
                                            </td>
                                            <td className="py-4 px-4 text-right font-semibold text-gray-900">
                                                {link.clicks.toLocaleString()}
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <Link
                                                    href={`/analytics/${link.short_code}`}
                                                    className="text-blue-600 hover:text-blue-700 text-xs font-semibold"
                                                >
                                                    View Analytics →
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}
