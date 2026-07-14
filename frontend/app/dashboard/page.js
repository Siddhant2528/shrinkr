"use client"

import { useEffect, useState } from "react"
import {
    Tooltip, ResponsiveContainer, PieChart, Pie,
    Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts"
import DashboardLayout from "@/components/DashboardLayout"
import StatCard from "@/components/StatCard"
import { dashboardApi } from "@/lib/api"
import Link from "next/link"
import DashboardNav from "@/components/DashboardNav"
import { StatsSkeleton, ChartSkeleton } from "@/components/Skeletons"

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"]

// ── Premium custom tooltip for bar chart ────────────────────────────────────
const CustomBarTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
        <div style={{
            background: "rgba(9,9,11,0.92)",
            border: "1px solid #27272A",
            borderRadius: "10px",
            padding: "10px 16px",
            color: "#fff",
            fontSize: "13px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)"
        }}>
            <p style={{ color: "#A1A1AA", marginBottom: 4, fontWeight: 500 }}>{label}</p>
            <p style={{ color: "#3b82f6", fontWeight: 700 }}>
                {payload[0].value} clicks
            </p>
        </div>
    )
}

// ── Custom animated bar shape with rounded tops ──────────────────────────────
const RoundedBar = (props) => {
    const { x, y, width, height, fill } = props
    if (!height || height <= 0) return null
    const radius = 6
    return (
        <path
            d={`M${x},${y + height} L${x},${y + radius} Q${x},${y} ${x + radius},${y} L${x + width - radius},${y} Q${x + width},${y} ${x + width},${y + radius} L${x + width},${y + height} Z`}
            fill={fill}
            style={{ filter: "drop-shadow(0 2px 6px rgba(59,130,246,0.25))" }}
        />
    )
}

export default function DashboardPage() {
    const [dashboard, setDashboard] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const data = await dashboardApi.getSummary()

                if (data.detail && data.detail.includes("Admin")) {
                    const { authApi } = await import("@/lib/api")
                    const stats = await authApi.myStats()
                    setDashboard({
                        summary: {
                            total_urls: stats.total_links,
                            total_clicks: stats.total_clicks,
                            clicks_today: 0,
                            active_urls: stats.active_links,
                        },
                        top_links: [],
                        recent_clicks: [],
                        clicks_by_country: {},
                        clicks_by_device: {},
                        isPersonal: true,
                    })
                    return
                }

                if (data.detail) {
                    setError(data.detail)
                    return
                }

                setDashboard(data)
            } catch {
                setError("Failed to load dashboard")
            } finally {
                setIsLoading(false)
            }
        }

        fetchDashboard()
    }, [])

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="space-y-4">
                    <div className="h-7 bg-gray-200 dark:bg-zinc-800 rounded-lg w-1/4 animate-pulse" />
                    <div className="h-4 bg-gray-100 dark:bg-zinc-800 rounded w-1/3 animate-pulse" />
                    <StatsSkeleton count={4} />
                    <ChartSkeleton />
                </div>
            </DashboardLayout>
        )
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="card p-8 text-center">
                    <p className="text-4xl mb-4">⚠️</p>
                    <p className="text-gray-600 dark:text-zinc-300 font-medium mb-2">{error}</p>
                </div>
            </DashboardLayout>
        )
    }

    // Prepare chart data
    const countryData = Object.entries(dashboard?.clicks_by_country || {})
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6)

    const rawDeviceData = Object.entries(dashboard?.clicks_by_device || {})
        .map(([name, value]) => ({ name, value }))

    const totalDeviceClicks = rawDeviceData.reduce((s, d) => s + d.value, 0)
    const deviceData = rawDeviceData.map(d => ({
        ...d,
        pct: totalDeviceClicks > 0 ? Math.round((d.value / totalDeviceClicks) * 100) : 0
    }))

    return (
        <DashboardLayout>
            {/* Tighter top spacing — 8-point grid: space-y-6 = 24px */}
            <div className="space-y-6">

                {/* ── Page header (compact) ── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100">Dashboard</h1>
                        <p className="text-gray-500 dark:text-zinc-400 text-xs mt-0.5">
                            Platform overview and analytics
                        </p>
                    </div>
                </div>

                {/* ── Nav tabs (directly under header, no gap) ── */}
                <DashboardNav isPersonal={dashboard?.isPersonal} />

                {/* ── Stat cards — 4 in a row ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Links"
                        value={dashboard?.summary?.total_urls?.toLocaleString()}
                        subtitle="All time"
                        icon="🔗"
                        color="blue"
                    />
                    <StatCard
                        title="Total Clicks"
                        value={dashboard?.summary?.total_clicks?.toLocaleString()}
                        subtitle="All time"
                        icon="📊"
                        color="orange"
                    />
                    <StatCard
                        title="Clicks Today"
                        value={dashboard?.summary?.clicks_today?.toLocaleString()}
                        subtitle="Last 24 hours"
                        icon="⚡"
                        color="purple"
                    />
                    <StatCard
                        title="Active Links"
                        value={dashboard?.summary?.active_urls?.toLocaleString()}
                        subtitle="Currently active"
                        icon="✅"
                        color="green"
                    />
                </div>

                {/* ── Charts row ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Country bar chart */}
                    <div className="card p-6 lg:col-span-2">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-4">
                            Clicks by Country
                        </h2>
                        {countryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={countryData} margin={{ top: 4, right: 0, bottom: 0, left: -20 }}>
                                    <CartesianGrid strokeDasharray="0" stroke="rgba(100,100,120,0.08)" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 11, fill: "#71717A" }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: "#71717A" }}
                                        axisLine={false}
                                        tickLine={false}
                                        allowDecimals={false}
                                    />
                                    <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "rgba(59,130,246,0.06)", radius: 6 }} />
                                    <Bar dataKey="value" fill="#3b82f6" shape={<RoundedBar />} name="Clicks" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-56 flex items-center justify-center text-gray-400 dark:text-zinc-600 text-sm">
                                No click data yet
                            </div>
                        )}
                    </div>

                    {/* Device donut chart + legend */}
                    <div className="card p-6">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-4">
                            Device Breakdown
                        </h2>
                        {deviceData.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height={150}>
                                    <PieChart>
                                        <Pie
                                            data={deviceData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={42}
                                            outerRadius={68}
                                            paddingAngle={3}
                                            dataKey="value"
                                            isAnimationActive={true}
                                            animationBegin={0}
                                            animationDuration={700}
                                        >
                                            {deviceData.map((_, index) => (
                                                <Cell
                                                    key={index}
                                                    fill={COLORS[index % COLORS.length]}
                                                    stroke="none"
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                background: "rgba(9,9,11,0.92)",
                                                border: "1px solid #27272A",
                                                borderRadius: "10px",
                                                fontSize: "12px",
                                                color: "#fff"
                                            }}
                                            formatter={(value, name) => [`${value} clicks`, name]}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>

                                {/* Legend with % */}
                                <div className="space-y-2 mt-3">
                                    {deviceData.map((item, index) => (
                                        <div key={item.name} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2.5">
                                                <div
                                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                                />
                                                <span className="text-gray-600 dark:text-zinc-400">{item.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-900 dark:text-zinc-100 tabular-nums">
                                                    {item.pct}%
                                                </span>
                                                <span className="text-xs text-gray-400 dark:text-zinc-600 tabular-nums">
                                                    ({item.value})
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="h-56 flex items-center justify-center text-gray-400 dark:text-zinc-600 text-sm">
                                No click data yet
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Top links + Recent clicks ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Top links */}
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                                Top Links
                            </h2>
                            <Link href="/links"
                                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors">
                                View all →
                            </Link>
                        </div>

                        {dashboard?.top_links?.length > 0 ? (
                            <div className="space-y-1">
                                {dashboard.top_links.slice(0, 5).map((link, index) => (
                                    <div key={link.short_code}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-default">
                                        <span className="text-xs font-bold text-gray-300 dark:text-zinc-600 w-4 text-right tabular-nums">
                                            {index + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-mono font-semibold text-blue-600 dark:text-blue-400 truncate">
                                                /{link.short_code}
                                            </p>
                                            <p className="text-xs text-gray-400 dark:text-zinc-500 truncate">
                                                {link.original_url}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-sm font-bold text-gray-900 dark:text-zinc-100 tabular-nums">
                                                {link.clicks}
                                            </p>
                                            <p className="text-xs text-gray-400 dark:text-zinc-600">clicks</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400 dark:text-zinc-600 text-sm">
                                No links yet
                            </div>
                        )}
                    </div>

                    {/* Recent clicks */}
                    <div className="card p-6">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-4">
                            Recent Clicks
                        </h2>

                        {dashboard?.recent_clicks?.length > 0 ? (
                            <div className="space-y-1">
                                {dashboard.recent_clicks.slice(0, 5).map((click, index) => (
                                    <div key={index}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                                        <div className="w-8 h-8 bg-gray-50 dark:bg-zinc-800 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                                            {click.device === "Mobile" ? "📱" :
                                             click.device === "Tablet" ? "📟" : "💻"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-mono font-semibold text-blue-600 dark:text-blue-400">
                                                /{click.short_code}
                                            </p>
                                            <p className="text-xs text-gray-400 dark:text-zinc-500">
                                                {click.browser || "Unknown"} · {click.country || "Unknown location"}
                                            </p>
                                        </div>
                                        <p className="text-xs text-gray-400 dark:text-zinc-600 flex-shrink-0 tabular-nums">
                                            {new Date(click.clicked_at).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit"
                                            })}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400 dark:text-zinc-600 text-sm">
                                No recent clicks
                            </div>
                        )}
                    </div>

                </div>

            </div>
        </DashboardLayout>
    )
}