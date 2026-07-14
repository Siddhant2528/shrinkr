"use client"

import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { useEffect, useState } from "react"

export default function ThemeToggle({ className = "" }) {
    const { theme, setTheme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    // Avoid hydration mismatch — only render after mount
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <div className={`w-8 h-8 ${className}`} />
    }

    const isDark = resolvedTheme === "dark"

    const toggleTheme = () => {
        const nextTheme = isDark ? "light" : "dark"
        setTheme(nextTheme)
        
        // Force the class toggle immediately on the document element
        if (typeof window !== "undefined") {
            const root = window.document.documentElement
            if (nextTheme === "dark") {
                root.classList.add("dark")
            } else {
                root.classList.remove("dark")
            }
            // Explicitly persist in localStorage as a backup
            localStorage.setItem("theme", nextTheme)
        }
    }

    return (
        <button
            id="theme-toggle"
            onClick={toggleTheme}
            className={`
                p-2 rounded-lg transition-all duration-200
                text-gray-500 hover:text-gray-900 hover:bg-gray-100
                dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-700
                cursor-pointer
                ${className}
            `}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
            {isDark ? (
                <Sun size={18} strokeWidth={2} />
            ) : (
                <Moon size={18} strokeWidth={2} />
            )}
        </button>
    )
}
