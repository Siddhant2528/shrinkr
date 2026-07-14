"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import ThemeToggle from "@/components/ThemeToggle"

export default function Navbar() {
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [username, setUsername] = useState("")
    const [menuOpen, setMenuOpen] = useState(false)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        const token = localStorage.getItem("token")
        const storedUsername = localStorage.getItem("username")
        if (token) {
            setIsLoggedIn(true)
            setUsername(storedUsername || "")
        }
    }, [pathname])

    const handleLogout = () => {
        localStorage.clear()
        setIsLoggedIn(false)
        setMenuOpen(false)
        router.push("/")
    }

    return (
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-xl">🔗</span>
                        <span className="text-xl font-bold text-gray-900">
                            shrinkr<span className="text-blue-600">.</span>
                        </span>
                    </Link>

                    {/* Desktop nav */}
                    <div className="hidden md:flex items-center gap-6">
                        {isLoggedIn && (
                            <>
                                <Link href="/dashboard"
                                    className={`text-sm font-medium transition-colors ${pathname === "/dashboard"
                                            ? "text-blue-600"
                                            : "text-gray-500 hover:text-gray-900"
                                        }`}>
                                    Dashboard
                                </Link>
                                <Link href="/links"
                                    className={`text-sm font-medium transition-colors ${pathname === "/links"
                                            ? "text-blue-600"
                                            : "text-gray-500 hover:text-gray-900"
                                        }`}>
                                    My Links
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Desktop auth */}
                    <div className="hidden md:flex items-center gap-3">
                        <Link href="/"
                            className={`text-sm font-medium transition-colors mr-3 flex items-center gap-1 ${pathname === "/" ? "text-blue-600" : "text-gray-500 hover:text-gray-900"}`}>
                            🏠 Home
                        </Link>
                        <ThemeToggle className="mr-2" />
                        {isLoggedIn ? (
                            <div className="flex items-center gap-3">
                                <Link href="/settings"
                                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                                    <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-blue-600 text-xs font-bold">
                                            {username?.[0]?.toUpperCase()}
                                        </span>
                                    </div>
                                    {username}
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <>
                                <Link href="/login"
                                    className="text-sm font-medium text-gray-600 hover:text-gray-900">
                                    Login
                                </Link>
                                <Link href="/register"
                                    className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                    >
                        {menuOpen ? "✕" : "☰"}
                    </button>

                </div>
            </div>

            {/* Mobile menu */}
            {menuOpen && (
                <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-500">Theme</span>
                        <ThemeToggle />
                    </div>
                    <Link href="/"
                        onClick={() => setMenuOpen(false)}
                        className={`block text-sm font-medium py-2 ${pathname === "/" ? "text-blue-600" : "text-gray-700"}`}>
                        🏠 Home
                    </Link>
                    {isLoggedIn ? (
                        <>
                            <Link href="/dashboard"
                                onClick={() => setMenuOpen(false)}
                                className="block text-sm font-medium text-gray-700 py-2">
                                Dashboard
                            </Link>
                            <Link href="/links"
                                onClick={() => setMenuOpen(false)}
                                className="block text-sm font-medium text-gray-700 py-2">
                                My Links
                            </Link>
                            <Link href="/analytics"
                                onClick={() => setMenuOpen(false)}
                                className="block text-sm font-medium text-gray-700 py-2">
                                Analytics
                            </Link>
                            <Link href="/api-keys"
                                onClick={() => setMenuOpen(false)}
                                className="block text-sm font-medium text-gray-700 py-2">
                                API Keys
                            </Link>
                            <Link href="/settings"
                                onClick={() => setMenuOpen(false)}
                                className="block text-sm font-medium text-gray-700 py-2">
                                Settings
                            </Link>
                            <div className="pt-2 border-t border-gray-100">
                                <button
                                    onClick={handleLogout}
                                    className="text-sm text-red-500 font-medium py-2">
                                    Sign out
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <Link href="/login"
                                onClick={() => setMenuOpen(false)}
                                className="block text-sm font-medium text-gray-700 py-2">
                                Login
                            </Link>
                            <Link href="/register"
                                onClick={() => setMenuOpen(false)}
                                className="block bg-blue-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg text-center">
                                Get Started
                            </Link>
                        </>
                    )}
                </div>
            )}
        </nav>
    )
}