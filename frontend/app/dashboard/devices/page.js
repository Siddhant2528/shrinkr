"use client"

import { useEffect, useState } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import DashboardNav from "@/components/DashboardNav"
import { dashboardApi } from "@/lib/api"
import { useRouter } from "next/navigation"

import { TableSkeleton } from "@/components/Skeletons"

export default function DevicesPage() {
    const [devices, setDevices] = useState({})
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")
    const router = useRouter()

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const data = await dashboardApi.getDevices()

                if (data.detail && data.detail.includes("Admin")) {
                    router.push("/dashboard")
                    return
                }

                if (data.detail) {
                    setError(data.detail)
                    return
                }

                setDevices(data || {})
            } catch (err) {
                setError("Failed to load device breakdown")
            } finally {
                setIsLoading(false)
            }
        }

        fetchDevices()
    }, [router])

    const sortedDevices = Object.entries(devices)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)

    const totalClicks = sortedDevices.reduce((sum, item) => sum + item.value, 0)

    const getDeviceIcon = (deviceName) => {
        const name = deviceName.toLowerCase()
        if (name.includes("mobile") || name.includes("phone")) return "📱"
        if (name.includes("tablet") || name.includes("ipad")) return "📟"
        return "💻"
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Visitor platform configurations and technology specifications
                    </p>
                </div>

                <DashboardNav isPersonal={false} />

                <div className="card p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-6">
                        Device & Technology Breakdown
                    </h2>

                    {isLoading ? (
                        <TableSkeleton cols={3} rows={4} />
                    ) : error ? (
                        <p className="text-red-500 text-sm text-center py-6">{error}</p>
                    ) : sortedDevices.length === 0 ? (
                        <div className="text-center py-8 flex flex-col items-center justify-center">
                            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-xl mb-3">
                                💻
                            </div>
                            <p className="text-gray-500 text-sm">No technology logs recorded yet</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-500">
                                <thead className="text-xs text-gray-400 uppercase border-b border-gray-100">
                                    <tr>
                                        <th className="py-3 px-4 font-semibold">Device / Agent</th>
                                        <th className="py-3 px-4 font-semibold text-right">Clicks</th>
                                        <th className="py-3 px-4 font-semibold text-right">Percentage</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {sortedDevices.map((item) => {
                                        const percent = totalClicks > 0 ? (item.value / totalClicks) * 100 : 0
                                        return (
                                            <tr key={item.name} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="py-4 px-4 font-medium text-gray-800 flex items-center gap-2">
                                                    <span>{getDeviceIcon(item.name)}</span>
                                                    <span>{item.name}</span>
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
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}
