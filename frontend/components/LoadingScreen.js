"use client"

import { useTheme } from "next-themes"

export default function LoadingScreen({ message = "Loading..." }) {
    const { resolvedTheme } = useTheme()
    const isDark = resolvedTheme === "dark"

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                // Use inline style (not Tailwind) so dark mode resolves before hydration
                backgroundColor: isDark ? "#09090B" : "#F8FAFC",
                transition: "background-color 0.15s ease",
            }}
        >
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500 dark:text-zinc-400 text-sm">{message}</p>
            </div>
        </div>
    )
}