"use client"

export function TableSkeleton({ rows = 5, cols = 4 }) {
    return (
        <div className="w-full space-y-4 animate-pulse">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-500">
                    <thead className="text-xs text-gray-400 uppercase border-b border-gray-100">
                        <tr>
                            {[...Array(cols)].map((_, i) => (
                                <th key={i} className="py-3 px-6">
                                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {[...Array(rows)].map((_, r) => (
                            <tr key={r}>
                                {[...Array(cols)].map((_, c) => (
                                    <td key={c} className="px-6 py-4">
                                        <div className="h-4 bg-gray-100 rounded w-5/6" />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export function StatsSkeleton({ count = 4 }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[...Array(count)].map((_, i) => (
                <div key={i} className="card p-6 flex flex-col justify-between h-28">
                    <div className="flex items-center justify-between">
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                        <div className="w-8 h-8 rounded-full bg-gray-200" />
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-1/3 mt-2" />
                </div>
            ))}
        </div>
    )
}

export function ChartSkeleton() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
            <div className="card p-6 lg:col-span-2 h-72 flex flex-col justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="flex-1 bg-gray-50 rounded-xl mt-4" />
            </div>
            <div className="card p-6 h-72 flex flex-col justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="flex-1 rounded-full bg-gray-50 max-w-[200px] aspect-square mx-auto mt-4" />
            </div>
        </div>
    )
}
