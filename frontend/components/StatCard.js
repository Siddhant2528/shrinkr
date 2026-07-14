export default function StatCard({ title, value, subtitle, icon, color = "blue" }) {
    const colors = {
        blue: {
            bg: "bg-blue-50 dark:bg-blue-950/30",
            text: "text-blue-600 dark:text-blue-400",
            border: "border-blue-100 dark:border-blue-900/40",
        },
        green: {
            bg: "bg-green-50 dark:bg-green-950/30",
            text: "text-green-600 dark:text-green-400",
            border: "border-green-100 dark:border-green-900/40",
        },
        purple: {
            bg: "bg-purple-50 dark:bg-purple-950/30",
            text: "text-purple-600 dark:text-purple-400",
            border: "border-purple-100 dark:border-purple-900/40",
        },
        orange: {
            bg: "bg-orange-50 dark:bg-orange-950/30",
            text: "text-orange-600 dark:text-orange-400",
            border: "border-orange-100 dark:border-orange-900/40",
        },
    }

    const c = colors[color] || colors.blue

    return (
        <div className="card p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
                        {title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100 tabular-nums">
                        {value ?? "—"}
                    </p>
                    {subtitle && (
                        <p className="text-xs text-gray-400 dark:text-zinc-600 mt-1">
                            {subtitle}
                        </p>
                    )}
                </div>
                {/* Fixed 40×40 icon container — same size for all cards */}
                <div className={`w-10 h-10 rounded-xl ${c.bg} ${c.border} border flex items-center justify-center text-lg flex-shrink-0`}>
                    {icon}
                </div>
            </div>
        </div>
    )
}