"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import LoadingScreen from "./LoadingScreen"
import ShortenForm from "./ShortenForm"
import ThemeToggle from "./ThemeToggle"
import { Globe } from "lucide-react"

const navItems = [
    { href: "/dashboard", icon: "📊", label: "Dashboard" },
    { href: "/links", icon: "🔗", label: "My Links" },
    { href: "/analytics", icon: "📈", label: "Analytics" },
    { href: "/api-keys", icon: "🔑", label: "API Keys" },
    { href: "/settings", icon: "⚙️", label: "Settings" },
    { href: "/settings/domains", icon: <Globe size={14} />, label: "Custom Domains" },
]

export default function DashboardLayout({ children }) {
    const pathname = usePathname()
    const { user, isLoading, logout } = useAuth()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [showShortenModal, setShowShortenModal] = useState(false)

    if (isLoading) return <LoadingScreen message="Loading..." />

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex transition-colors duration-200">

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-20 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 h-full w-64 bg-white dark:bg-zinc-900 border-r border-gray-100 dark:border-zinc-800
                flex flex-col z-30 transition-transform duration-200
                ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
                md:translate-x-0
            `}>
                {/* Logo */}
                <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-xl">🔗</span>
                        <span className="text-lg font-bold text-gray-900 dark:text-zinc-100">
                            shrinkr<span className="text-blue-600">.</span>
                        </span>
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="md:hidden text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                    >
                        ✕
                    </button>
                </div>

                {/* Quick Action Button */}
                <div className="px-4 pt-4 pb-2">
                    <button
                        onClick={() => setShowShortenModal(true)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md cursor-pointer border-none"
                    >
                        <span className="text-base font-bold">+</span>
                        <span>Shorten URL</span>
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== "/dashboard" && pathname.startsWith(item.href))
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                                }`}
                            >
                                <span className="text-sm">{item.icon}</span>
                                <span>{item.label}</span>
                                {isActive && (
                                    <span className="ml-auto w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
                                )}
                            </Link>
                        )
                    })}

                    {/* Divider */}
                    <div className="pt-2 mt-2 border-t border-gray-100 dark:border-zinc-800">
                        <a
                            href="https://shrinkr-api.onrender.com/docs"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                        >
                            <span>📄</span>
                            <span>API Docs</span>
                            <span className="ml-auto text-xs text-gray-300 dark:text-slate-600">↗</span>
                        </a>
                    </div>
                </nav>

                {/* User section */}
                <div className="p-4 border-t border-gray-100 dark:border-zinc-800">
                    <div className="flex items-center gap-3 mb-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800">
                        <div className="w-8 h-8 bg-blue-50 dark:bg-blue-950/30 rounded-full flex items-center justify-center shrink-0">
                            <span className="text-blue-600 dark:text-blue-400 text-sm font-bold">
                                {user?.username?.[0]?.toUpperCase()}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">
                                {user?.username}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-zinc-500 truncate">
                                {user?.email}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full text-left text-sm text-gray-500 hover:text-red-500 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors dark:text-zinc-400 dark:hover:text-red-400 dark:hover:bg-red-950/30"
                    >
                        Sign out →
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen">

                {/* Top header bar */}
                <header className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 h-14 px-4 md:px-8 flex items-center justify-between sticky top-0 z-10 transition-colors duration-200">
                    {/* Left section */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="md:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200 cursor-pointer border-none bg-none"
                        >
                            ☰
                        </button>
                        <span className="font-bold text-gray-900 dark:text-zinc-100 md:hidden">
                            shrinkr<span className="text-blue-600">.</span>
                        </span>
                    </div>

                    {/* Right section */}
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1.5 cursor-pointer dark:text-zinc-400 dark:hover:text-blue-400"
                            title="Go to Home Landing page"
                        >
                            <span>🏠</span>
                            <span className="hidden sm:inline text-gray-600 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400">Home</span>
                        </Link>
                        <div className="h-5 w-px bg-gray-200 dark:bg-zinc-700" />
                        <ThemeToggle />
                        <div className="h-5 w-px bg-gray-200 dark:bg-zinc-700" />
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-50 dark:bg-blue-950/30 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">
                                    {user?.username?.[0]?.toUpperCase()}
                                </span>
                            </div>
                            <span className="hidden md:inline text-sm font-medium text-gray-700 dark:text-zinc-300">
                                {user?.username}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 md:p-8">
                    {children}
                </main>

            </div>

            {/* Shorten URL Modal */}
            {showShortenModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 relative">
                        <button
                            onClick={() => setShowShortenModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300 text-lg font-medium p-1 transition-colors cursor-pointer border-none bg-none"
                        >
                            ✕
                        </button>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                            <span>🔗</span> Shorten a URL
                        </h2>
                        <ShortenForm />
                    </div>
                </div>
            )}

        </div>
    )
}