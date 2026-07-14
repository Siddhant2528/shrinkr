"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function DashboardNav({ isPersonal }) {
    const pathname = usePathname()

    if (isPersonal) return null

    const tabs = [
        { href: "/dashboard", label: "Overview" },
        { href: "/dashboard/top-links", label: "Top Links" },
        { href: "/dashboard/countries", label: "Countries" },
        { href: "/dashboard/devices", label: "Devices" },
        { href: "/dashboard/recent", label: "Recent Clicks" },
    ]

    return (
        <div className="border-b border-gray-200 dark:border-zinc-800">
            <nav className="flex space-x-1 -mb-px overflow-x-auto">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={`pb-3 px-3 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
                                isActive
                                    ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                                    : "border-transparent text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300 hover:border-gray-300 dark:hover:border-zinc-600"
                            }`}
                        >
                            {tab.label}
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
