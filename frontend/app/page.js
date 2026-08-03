import Navbar from "@/components/Navbar"
import ShortenForm from "@/components/ShortenForm"
import Link from "next/link"
import { Zap, Database, Code2, Sparkles } from "lucide-react"

const features = [
    {
        icon: "⚡",
        title: "Fast Redirects",
        desc: "Sub-millisecond redirects powered by Redis caching.",
        color: "bg-yellow-50 text-yellow-600",
    },
    {
        icon: "📊",
        title: "Real-time Analytics",
        desc: "Track clicks, countries, devices, and browsers live.",
        color: "bg-blue-50 text-blue-600",
    },
    {
        icon: "🌍",
        title: "Geo Tracking",
        desc: "Know where your visitors come from with GeoIP.",
        color: "bg-green-50 text-green-600",
    },
    {
        icon: "📱",
        title: "QR Codes",
        desc: "Instant QR code generation for every short link.",
        color: "bg-purple-50 text-purple-600",
    },
    {
        icon: "🔐",
        title: "API Keys",
        desc: "Programmatic access with rate-limited API keys.",
        color: "bg-red-50 text-red-600",
    },
    {
        icon: "🛡️",
        title: "Rate Limiting",
        desc: "Sliding window algorithm protects from abuse.",
        color: "bg-orange-50 text-orange-600",
    },
]

const stats = [
    { value: "< 5ms", label: "Redirect latency", icon: Zap, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20" },
    { value: "Redis", label: "Cache layer", icon: Database, color: "text-red-500 bg-red-50 dark:bg-red-950/20" },
    { value: "20+", label: "API endpoints", icon: Code2, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20" },
    { value: "Free", label: "Always", icon: Sparkles, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" },
]

export default function HomePage() {
    return (
        <div className="min-h-screen bg-shrinkr-bg">
            <Navbar />

            <main>

                {/* Hero section */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-10">
                    <div className="text-center max-w-3xl mx-auto mb-8">

                        {/* Heading */}
                        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-4 leading-tight tracking-tight">
                            Shorten URLs.{" "}
                            <br />
                            <span className="text-blue-600">
                                Track Everything.
                            </span>
                        </h1>

                        {/* Subtitle */}
                        <p className="text-lg text-gray-500 mb-6 leading-relaxed max-w-2xl mx-auto">
                            A developer-focused URL shortener with real-time analytics,
                            geo tracking, QR codes, and Redis caching.
                            Built with FastAPI and PostgreSQL.
                        </p>

                    </div>

                    {/* Shorten form — compact card, the main focal point */}
                    <div className="max-w-xl mx-auto">
                        <div className="card card-static p-5 shadow-md">
                            <ShortenForm />
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10 max-w-2xl mx-auto">
                        {stats.map((stat) => {
                            const IconComponent = stat.icon
                            return (
                                <div key={stat.label} className="text-center flex flex-col items-center">
                                    <div className={`p-2 rounded-xl mb-2 flex items-center justify-center ${stat.color}`}>
                                        <IconComponent size={20} />
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {stat.value}
                                    </p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        {stat.label}
                                    </p>
                                </div>
                            )
                        })}
                    </div>

                </section>

                {/* Features grid */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-gray-100">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Everything you need
                        </h2>
                        <p className="text-gray-500 max-w-xl mx-auto">
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
                                <h3 className="text-base font-semibold text-gray-900 mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-500 text-sm leading-relaxed">
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA section */}
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

                {/* Footer */}
                <footer className="border-t border-gray-100 py-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🔗</span>
                                <span className="font-bold text-gray-900">
                                    shrinkr<span className="text-blue-600">.</span>
                                </span>
                            </div>
                            <p className="text-sm text-gray-400">
                                Built with FastAPI, PostgreSQL, Redis, Next.js
                            </p>
                            <a
                                href="https://github.com/yourusername/shrinkr"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-gray-400 hover:text-gray-600"
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