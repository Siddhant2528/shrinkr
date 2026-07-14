"use client"

import { useEffect, useState } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import DashboardNav from "@/components/DashboardNav"
import { dashboardApi } from "@/lib/api"
import { useRouter } from "next/navigation"

import { TableSkeleton } from "@/components/Skeletons"

export default function CountriesPage() {
    const [countries, setCountries] = useState({})
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")
    const router = useRouter()

    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const data = await dashboardApi.getCountries()

                if (data.detail && data.detail.includes("Admin")) {
                    router.push("/dashboard")
                    return
                }

                if (data.detail) {
                    setError(data.detail)
                    return
                }

                setCountries(data || {})
            } catch (err) {
                setError("Failed to load country breakdown")
            } finally {
                setIsLoading(false)
            }
        }

        fetchCountries()
    }, [router])

    const sortedCountries = Object.entries(countries)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)

    const totalClicks = sortedCountries.reduce((sum, item) => sum + item.value, 0)

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Visitor demographics and geolocation tracking
                    </p>
                </div>

                <DashboardNav isPersonal={false} />

                <div className="card p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-6">
                        Audience Location Breakdown
                    </h2>

                    {isLoading ? (
                        <TableSkeleton cols={3} rows={4} />
                    ) : error ? (
                        <p className="text-red-500 text-sm text-center py-6">{error}</p>
                    ) : sortedCountries.length === 0 ? (
                        <div className="text-center py-8 flex flex-col items-center justify-center">
                            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-xl mb-3">
                                🗺️
                            </div>
                            <p className="text-gray-500 text-sm">No visitor geodata recorded yet</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Summary alert */}
                            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex justify-between items-center text-sm text-blue-800">
                                <span>Unique visitor countries tracked</span>
                                <span className="font-bold text-blue-900">{sortedCountries.length}</span>
                            </div>

                            {/* Detail table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-gray-500">
                                    <thead className="text-xs text-gray-400 uppercase border-b border-gray-100">
                                        <tr>
                                            <th className="py-3 px-4 font-semibold">Location</th>
                                            <th className="py-3 px-4 font-semibold text-right">Clicks</th>
                                            <th className="py-3 px-4 font-semibold text-right">Percentage</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {sortedCountries.map((item) => {
                                            const percent = totalClicks > 0 ? (item.value / totalClicks) * 100 : 0
                                            return (
                                                <tr key={item.name} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="py-4 px-4 font-medium text-gray-800 flex items-center gap-2">
                                                        <span>🗺️</span>
                                                        <span>{item.name === "Unknown" ? "Unknown Geolocation" : item.name}</span>
                                                    </td>
                                                    <td className="py-4 px-4 text-right font-semibold text-gray-900">
                                                        {item.value.toLocaleString()}
                                                    </td>
                                                    <td className="py-4 px-4 text-right text-gray-400 font-medium">
                                                        {percent.toFixed(1)}%
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}
