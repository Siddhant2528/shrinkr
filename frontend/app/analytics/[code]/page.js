"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie,
    Cell, BarChart, Bar
} from "recharts"
import DashboardLayout from "@/components/DashboardLayout"
import { analyticsApi, urlApi } from "@/lib/api"
import { API_URL } from "@/lib/constants"

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-gray-100 rounded-lg p-3 shadow-lg text-sm">
                <p className="text-gray-500 mb-1">{label}</p>
                <p className="font-semibold text-gray-900">
                    {payload[0].value} clicks
                </p>
            </div>
        )
    }
    return null
}

export default function AnalyticsPage() {
    const { code } = useParams()
    const [analytics, setAnalytics] = useState(null)
    const [timeseries, setTimeseries] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")
    const [days, setDays] = useState(30)
    const [activeTab, setActiveTab] = useState("overview")

    useEffect(() => {
        if (code) fetchData()
    }, [code, days])

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const [analyticsData, timeseriesData] = await Promise.all([
                analyticsApi.getAnalytics(code),
                analyticsApi.getTimeseries(code, days),
            ])

            if (analyticsData.detail) {
                setError(analyticsData.detail)
                return
            }

            setAnalytics(analyticsData)
            setTimeseries(timeseriesData)
        } catch (err) {
            setError("Failed to load analytics")
        } finally {
            setIsLoading(false)
        }
    }

    // Prepare chart data
    const countryData = Object.entries(analytics?.clicks_by_country || {})
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)

    const deviceData = Object.entries(analytics?.clicks_by_device || {})
        .map(([name, value]) => ({ name, value }))

    const browserData = Object.entries(analytics?.clicks_by_browser || {})
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)

    const timeseriesData = timeseries?.timeseries?.map(item => ({
        date: new Date(item.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric"
        }),
        clicks: item.clicks,
    })) || []

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-100 rounded w-1/4" />
                    <div className="grid grid-cols-3 gap-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-24 bg-gray-100 rounded-xl" />
                        ))}
                    </div>
                    <div className="h-64 bg-gray-100 rounded-xl" />
                </div>
            </DashboardLayout>
        )
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="card p-12 text-center">
                    <p className="text-4xl mb-4">⚠️</p>
                    <p className="text-gray-600 font-medium mb-2">{error}</p>
                    <Link href="/links"
                        className="text-blue-600 text-sm hover:underline">
                        ← Back to links
                    </Link>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">

                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Link href="/links"
                                className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
                                ← My Links
                            </Link>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 font-mono">
                            /{code}
                        </h1>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm text-gray-400">
                                {analytics?.total_clicks || 0} total clicks
                            </span>
                            <span className="text-gray-200">·</span>
                            <a
                                href={`${API_URL}/qr/${code}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-500 hover:text-blue-700"
                            >
                                View QR →
                            </a>
                    </div>
                </div>

                {/* Days selector */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    {[7, 14, 30, 90].map((d) => (
                        <button
                            key={d}
                            onClick={() => setDays(d)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${days === d
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            {d}d
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card p-5">
                    <p className="text-sm text-gray-500 mb-1">Total Clicks</p>
                    <p className="text-3xl font-bold text-gray-900">
                        {analytics?.total_clicks?.toLocaleString() || 0}
                    </p>
                </div>
                <div className="card p-5">
                    <p className="text-sm text-gray-500 mb-1">Countries</p>
                    <p className="text-3xl font-bold text-gray-900">
                        {countryData.length}
                    </p>
                </div>
                <div className="card p-5">
                    <p className="text-sm text-gray-500 mb-1">Browsers</p>
                    <p className="text-3xl font-bold text-gray-900">
                        {browserData.length}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-gray-100">
                {["overview", "geography", "technology"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${activeTab === tab
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Overview tab */}
            {activeTab === "overview" && (
                <div className="space-y-6">

                    {/* Timeseries chart */}
                    <div className="card p-6">
                        <h2 className="text-base font-semibold text-gray-900 mb-4">
                            Clicks over time
                            <span className="text-sm font-normal text-gray-400 ml-2">
                                Last {days} days
                            </span>
                        </h2>
                        {timeseriesData.some(d => d.clicks > 0) ? (
                            <ResponsiveContainer width="100%" height={240}>
                                <LineChart data={timeseriesData}
                                    margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#f1f5f9"
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                                        axisLine={false}
                                        tickLine={false}
                                        interval="preserveStartEnd"
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                                        axisLine={false}
                                        tickLine={false}
                                        allowDecimals={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Line
                                        type="monotone"
                                        dataKey="clicks"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 4, fill: "#3b82f6" }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-60 flex flex-col items-center justify-center text-gray-300">
                                <p className="text-4xl mb-3">📊</p>
                                <p className="text-sm">No clicks in the last {days} days</p>
                            </div>
                        )}
                    </div>

                    {/* Device + browser side by side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Device */}
                        <div className="card p-6">
                            <h2 className="text-base font-semibold text-gray-900 mb-4">
                                Devices
                            </h2>
                            {deviceData.length > 0 ? (
                                <div className="space-y-3">
                                    {deviceData.map((item, i) => {
                                        const total = deviceData.reduce((s, d) => s + d.value, 0)
                                        const pct = total > 0 ? Math.round((item.value / total) * 100) : 0
                                        return (
                                            <div key={item.name}>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-gray-600 flex items-center gap-2">
                                                        <span>{item.name === "Mobile" ? "📱" : item.name === "Tablet" ? "📟" : "💻"}</span>
                                                        {item.name}
                                                    </span>
                                                    <span className="font-medium text-gray-900">
                                                        {item.value} <span className="text-gray-400 font-normal">({pct}%)</span>
                                                    </span>
                                                </div>
                                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all"
                                                        style={{
                                                            width: `${pct}%`,
                                                            backgroundColor: COLORS[i % COLORS.length]
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <p className="text-gray-400 text-sm text-center py-8">
                                    No data yet
                                </p>
                            )}
                        </div>

                        {/* Browser */}
                        <div className="card p-6">
                            <h2 className="text-base font-semibold text-gray-900 mb-4">
                                Browsers
                            </h2>
                            {browserData.length > 0 ? (
                                <div className="space-y-3">
                                    {browserData.map((item, i) => {
                                        const total = browserData.reduce((s, d) => s + d.value, 0)
                                        const pct = total > 0 ? Math.round((item.value / total) * 100) : 0
                                        return (
                                            <div key={item.name}>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-gray-600">{item.name}</span>
                                                    <span className="font-medium text-gray-900">
                                                        {item.value} <span className="text-gray-400 font-normal">({pct}%)</span>
                                                    </span>
                                                </div>
                                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all"
                                                        style={{
                                                            width: `${pct}%`,
                                                            backgroundColor: COLORS[i % COLORS.length]
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <p className="text-gray-400 text-sm text-center py-8">
                                    No data yet
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Geography tab */}
            {activeTab === "geography" && (
                <div className="card p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-6">
                        Clicks by Country
                    </h2>
                    {countryData.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={countryData}
                                    margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={true} vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 12, fill: "#94a3b8" }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 12, fill: "#94a3b8" }}
                                        axisLine={false}
                                        tickLine={false}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: "white",
                                            border: "1px solid #e2e8f0",
                                            borderRadius: "8px",
                                            fontSize: "12px"
                                        }}
                                    />
                                    <Bar dataKey="value" name="Clicks" radius={[4, 4, 0, 0]}>
                                        {countryData.map((_, index) => (
                                            <Cell
                                                key={index}
                                                fill={COLORS[index % COLORS.length]}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>

                            {/* Country list */}
                            <div className="mt-6 space-y-2">
                                {countryData.map((item, i) => {
                                    const total = countryData.reduce((s, d) => s + d.value, 0)
                                    const pct = total > 0 ? Math.round((item.value / total) * 100) : 0
                                    return (
                                        <div key={item.name}
                                            className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                            <span className="text-sm text-gray-700 flex-1">
                                                {item.name}
                                            </span>
                                            <span className="text-sm font-medium text-gray-900">
                                                {item.value}
                                            </span>
                                            <span className="text-sm text-gray-400 w-10 text-right">
                                                {pct}%
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-16 text-gray-300">
                            <p className="text-4xl mb-3">🌍</p>
                            <p className="text-sm">No geographic data yet</p>
                            <p className="text-xs mt-1 text-gray-200">
                                Country data shows after real visitors click your link
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Technology tab */}
            {activeTab === "technology" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Device pie chart */}
                    <div className="card p-6">
                        <h2 className="text-base font-semibold text-gray-900 mb-4">
                            Device Types
                        </h2>
                        {deviceData.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                        <Pie
                                            data={deviceData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {deviceData.map((_, index) => (
                                                <Cell
                                                    key={index}
                                                    fill={COLORS[index % COLORS.length]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                background: "white",
                                                border: "1px solid #e2e8f0",
                                                borderRadius: "8px",
                                                fontSize: "12px"
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="space-y-2 mt-2">
                                    {deviceData.map((item, i) => (
                                        <div key={item.name}
                                            className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full"
                                                    style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                                <span className="text-gray-600">{item.name}</span>
                                            </div>
                                            <span className="font-medium text-gray-900">
                                                {item.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p className="text-gray-400 text-sm text-center py-12">No data yet</p>
                        )}
                    </div>

                    {/* Browser bar chart */}
                    <div className="card p-6">
                        <h2 className="text-base font-semibold text-gray-900 mb-4">
                            Browsers
                        </h2>
                        {browserData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart
                                    data={browserData}
                                    layout="vertical"
                                    margin={{ top: 0, right: 10, bottom: 0, left: 10 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={true} horizontal={false} />
                                    <XAxis
                                        type="number"
                                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                                        axisLine={false}
                                        tickLine={false}
                                        allowDecimals={false}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        tick={{ fontSize: 12, fill: "#64748b" }}
                                        axisLine={false}
                                        tickLine={false}
                                        width={60}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: "white",
                                            border: "1px solid #e2e8f0",
                                            borderRadius: "8px",
                                            fontSize: "12px"
                                        }}
                                    />
                                    <Bar dataKey="value" name="Clicks" radius={[0, 4, 4, 0]}>
                                        {browserData.map((_, index) => (
                                            <Cell
                                                key={index}
                                                fill={COLORS[index % COLORS.length]}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-gray-400 text-sm text-center py-12">No data yet</p>
                        )}
                    </div>
                </div>
            )}

        </div>
        </DashboardLayout >
    )
}