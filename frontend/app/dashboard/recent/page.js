"use client"

import { useEffect, useState } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import DashboardNav from "@/components/DashboardNav"
import { dashboardApi } from "@/lib/api"
import { useRouter } from "next/navigation"

import { TableSkeleton } from "@/components/Skeletons"

export default function RecentClicksPage() {
    const [clicks, setClicks] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")
    const router = useRouter()

    useEffect(() => {
        const fetchRecentClicks = async () => {
            try {
                const data = await dashboardApi.getRecentClicks()

                if (data.detail && data.detail.includes("Admin")) {
                    router.push("/dashboard")
                    return
                }

                if (data.detail) {
                    setError(data.detail)
                    return
                }

                setClicks(Array.isArray(data) ? data : [])
            } catch (err) {
                setError("Failed to load recent click logs")
            } finally {
                setIsLoading(false)
            }
        }

        fetchRecentClicks()
    }, [router])

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Real-time visitor logs and click streams
                    </p>
                </div>

                <DashboardNav isPersonal={false} />

                <div className="card p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-6">
                        Recent Clicks Stream
                    </h2>

                    {isLoading ? (
                        <TableSkeleton cols={6} rows={5} />
                    ) : error ? (
                        <p className="text-red-500 text-sm text-center py-6">{error}</p>
                    ) : clicks.length === 0 ? (
                        <div className="text-center py-8 flex flex-col items-center justify-center">
                            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-xl mb-3">
                                📊
                            </div>
                            <p className="text-gray-500 text-sm">No clicks recorded yet</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-500">
                                <thead className="text-xs text-gray-400 uppercase border-b border-gray-100">
                                    <tr>
                                        <th className="py-3 px-4 font-semibold">Timestamp</th>
                                        <th className="py-3 px-4 font-semibold">Short Link</th>
                                        <th className="py-3 px-4 font-semibold">Location</th>
                                        <th className="py-3 px-4 font-semibold">IP Address</th>
                                        <th className="py-3 px-4 font-semibold">Browser / OS</th>
                                        <th className="py-3 px-4 font-semibold">Referer</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {clicks.map((click, index) => (
                                        <tr key={`${click.short_code}-${click.clicked_at}-${index}`} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="py-4 px-4 font-medium text-gray-900">
                                                {new Date(click.clicked_at).toLocaleString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                    second: "2-digit",
                                                })}
                                            </td>
                                            <td className="py-4 px-4 font-mono text-blue-600 font-semibold">
                                                /{click.short_code}
                                            </td>
                                            <td className="py-4 px-4 text-gray-700">
                                                🗺️ {click.country === "Unknown" ? "Unknown" : click.country}
                                            </td>
                                            <td className="py-4 px-4 font-mono text-gray-500">
                                                {click.ip_address}
                                            </td>
                                            <td className="py-4 px-4 text-xs text-gray-600">
                                                {click.browser} / {click.device}
                                            </td>
                                            <td className="py-4 px-4 text-xs truncate max-w-xs text-gray-400">
                                                {click.referer === "Direct" ? (
                                                    <span className="text-gray-300 italic">Direct traffic</span>
                                                ) : (
                                                    click.referer
                                                )}
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
