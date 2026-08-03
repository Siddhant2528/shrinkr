import Navbar from "@/components/Navbar"
import ShortenForm from "@/components/ShortenForm"
import Link from "next/link"
import { Zap, Database, Code2, Sparkles, Globe, BarChart3, Shield, Clock } from "lucide-react"

const features = [
    {
        icon: "⚡",
        title: "Fast Redirects",
        desc: "Sub-millisecond redirects powered by Redis caching.",
        color: "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/30",
    },
    {
        icon: "📊",
        title: "Real-time Analytics",
        desc: "Track clicks, countries, devices, and browsers live.",
        color: "bg-blue-50 text-blue-600 dark:bg-blue-950/30",
    },
    {
        icon: "🌍",
        title: "Geo Tracking",
        desc: "Know where your visitors come from with GeoIP.",
        color: "bg-green-50 text-green-600 dark:bg-green-950/30",
    },
    {
        icon: "📱",
        title: "QR Codes",
        desc: "Instant QR code generation for every short link.",
        color: "bg-purple-50 text-purple-600 dark:bg-purple-950/30",
    },
    {
        icon: "🔐",
        title: "API Keys",
        desc: "Programmatic access with rate-limited API keys.",
        color: "bg-red-50 text-red-600 dark:bg-red-950/30",
    },
    {
        icon: "🛡️",
        title: "Rate Limiting",
        desc: "Sliding window algorithm protects from abuse.",
        color: "bg-orange-50 text-orange-600 dark:bg-orange-950/30",
    },
]

const stats = [
    { value: "< 5ms", label: "Redirect latency", icon: Zap, iconColor: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-100 dark:border-amber-900/30" },
    { value: "Redis", label: "Cache layer", icon: Database, iconColor: "text-red-500", bg: "bg-red-50 dark:bg-red-950/20", border: "border-red-100 dark:border-red-900/30" },
    { value: "20+", label: "API endpoints", icon: Code2, iconColor: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/20", border: "border-blue-100 dark:border-blue-900/30" },
    { value: "Free", label: "Always", icon: Sparkles, iconColor: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/20", border: "border-emerald-100 dark:border-emerald-900/30" },
]

// Mock analytics preview data for the right panel
const previewClicks = [
    { country: "🇺🇸 United States", pct: 78, color: "bg-blue-500" },
    { country: "🇬🇧 United Kingdom", pct: 52, color: "bg-indigo-400" },
    { country: "🇮🇳 India", pct: 44, color: "bg-purple-400" },
    { country: "🇩🇪 Germany", pct: 31, color: "bg-sky-400" },
]

const previewDevices = [
    { label: "Mobile", pct: 62, color: "bg-blue-500" },
    { label: "Desktop", pct: 31, color: "bg-indigo-400" },
    { label: "Tablet", pct: 7, color: "bg-slate-300" },
]

export default function HomePage() {
    return (
        <div className="min-h-screen bg-shrinkr-bg overflow-x-hidden">
            <Navbar />

            {/* Decorative background blobs */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-blue-100/50 dark:bg-blue-900/10 blur-3xl" />
                <div className="absolute top-48 -right-32 w-[400px] h-[400px] rounded-full bg-purple-100/40 dark:bg-purple-900/10 blur-3xl" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-indigo-50/60 dark:bg-indigo-900/10 blur-3xl" />
            </div>

            <main>

                {/* ── Hero ── */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14">

                    {/* Two-column layout on lg+, stacked on mobile */}
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

                        {/* ── Left column: heading + form + stats ── */}
                        <div className="flex-1 w-full min-w-0">

                            {/* Heading */}
                            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-4 leading-tight tracking-tight">
                                Shorten URLs.{" "}
                                <br />
                                <span className="text-blue-600">
                                    Track Everything.
                                </span>
                            </h1>

                            {/* Subtitle */}
                            <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 leading-relaxed max-w-xl">
                                A developer-focused URL shortener with real-time analytics,
                                geo tracking, QR codes, and Redis caching.
                                Built with FastAPI and PostgreSQL.
                            </p>

                            {/* Shorten form */}
                            <div className="card card-static p-5 shadow-md w-full max-w-2xl">
                                <ShortenForm />
                            </div>

                            {/* Stat cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 max-w-2xl">
                                {stats.map((stat) => {
                                    const Icon = stat.icon
                                    return (
                                        <div
                                            key={stat.label}
                                            className={`flex flex-col items-center text-center rounded-xl border p-4 ${stat.bg} ${stat.border}`}
                                        >
                                            <div className={`mb-2 ${stat.iconColor}`}>
                                                <Icon size={20} />
                                            </div>
                                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                                {stat.value}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {stat.label}
                                            </p>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* ── Right column: analytics preview card ── */}
                        <div className="w-full lg:w-[380px] xl:w-[420px] flex-shrink-0">
                            <div className="card card-static rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800">

                                {/* Card header */}
                                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-zinc-900">
                                    <div className="flex items-center gap-2">
                                        <BarChart3 size={16} className="text-blue-500" />
                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">Link Analytics</span>
                                    </div>
                                    <span className="text-xs text-gray-400 bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded-full">Last 30 days</span>
                                </div>

                                <div className="p-5 bg-white dark:bg-zinc-900 space-y-5">

                                    {/* Summary pills */}
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { label: "Total Clicks", value: "24,831" },
                                            { label: "Links", value: "142" },
                                            { label: "Countries", value: "38" },
                                        ].map(item => (
                                            <div key={item.label} className="text-center bg-gray-50 dark:bg-zinc-800 rounded-xl p-3">
                                                <p className="text-base font-bold text-gray-900 dark:text-white">{item.value}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">{item.label}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Clicks by country */}
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                                            <Globe size={12} /> Top Countries
                                        </p>
                                        <div className="space-y-2.5">
                                            {previewClicks.map((item) => (
                                                <div key={item.country}>
                                                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
                                                        <span>{item.country}</span>
                                                        <span className="font-medium">{item.pct}%</span>
                                                    </div>
                                                    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-zinc-700 overflow-hidden">
                                                        <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Device breakdown */}
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                                            <Shield size={12} /> Devices
                                        </p>
                                        <div className="flex gap-2 h-2 rounded-full overflow-hidden">
                                            {previewDevices.map((d) => (
                                                <div key={d.label} className={`${d.color} rounded-full`} style={{ width: `${d.pct}%` }} />
                                            ))}
                                        </div>
                                        <div className="flex gap-4 mt-2">
                                            {previewDevices.map((d) => (
                                                <div key={d.label} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                    <div className={`w-2 h-2 rounded-full ${d.color}`} />
                                                    {d.label} <span className="font-medium text-gray-700 dark:text-gray-200">{d.pct}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Recent clicks */}
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                                            <Clock size={12} /> Recent Activity
                                        </p>
                                        <div className="space-y-2">
                                            {[
                                                { code: "go/launch", url: "producthunt.com/...", time: "2m ago", flag: "🇺🇸" },
                                                { code: "go/docs", url: "notion.so/my-docs...", time: "8m ago", flag: "🇬🇧" },
                                                { code: "go/sale", url: "shop.example.com/...", time: "15m ago", flag: "🇮🇳" },
                                            ].map((click) => (
                                                <div key={click.code} className="flex items-center justify-between text-xs bg-gray-50 dark:bg-zinc-800 rounded-lg px-3 py-2">
                                                    <div>
                                                        <span className="font-medium text-blue-600">{click.code}</span>
                                                        <span className="text-gray-400 ml-1">→ {click.url}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-gray-400 flex-shrink-0 ml-2">
                                                        <span>{click.flag}</span>
                                                        <span>{click.time}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                </div>

                                {/* Card footer */}
                                <div className="px-5 py-3 bg-blue-50 dark:bg-blue-950/20 border-t border-blue-100 dark:border-blue-900/30 text-center">
                                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                        ✨ Full analytics on every link you shorten
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </section>

                {/* ── Features grid ── */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-gray-100 dark:border-gray-800">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                            Everything you need
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
                            Built with production patterns — caching, background workers,
                            rate limiting, and proper auth.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature) => (
                            <div key={feature.title}
                                className="card p-6 hover:shadow-md transition-shadow">
                                <div className={`w-10 h-10 rounded-lg ${feature.color} flex items-center justify-center text-lg mb-4`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── CTA section ── */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="bg-blue-600 rounded-2xl p-12 text-center">
                        <h2 className="text-3xl font-bold text-white mb-4">
                            Ready to get started?
                        </h2>
                        <p className="text-blue-100 mb-8 max-w-md mx-auto">
                            Create a free account to track your links,
                            view analytics, and access the API.
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            <Link href="/register"
                                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors">
                                Create Free Account
                            </Link>
                            <Link href="/login"
                                className="text-white border border-blue-400 px-8 py-3 rounded-lg font-medium hover:bg-blue-500 transition-colors">
                                Sign In
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ── Footer ── */}
                <footer className="border-t border-gray-100 dark:border-gray-800 py-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🔗</span>
                                <span className="font-bold text-gray-900 dark:text-white">
                                    shrinkr<span className="text-blue-600">.</span>
                                </span>
                            </div>
                            <p className="text-sm text-gray-400">
                                Built with FastAPI, PostgreSQL, Redis, Next.js
                            </p>
                            <a
                                href="https://github.com/Siddhant2528/shrinkr"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                GitHub →
                            </a>
                        </div>
                    </div>
                </footer>

            </main>
        </div>
    )
}