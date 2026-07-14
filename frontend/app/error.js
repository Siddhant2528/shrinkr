"use client"

export default function Error({ error, reset }) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 relative overflow-hidden">
            {/* Ambient background glows */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-red-100/40 filter blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/3 w-80 h-80 rounded-full bg-amber-100/30 filter blur-3xl pointer-events-none" />

            <div className="text-center max-w-md relative z-10 animate-fadeIn">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-inner animate-bounce">
                    ⚠️
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-3">
                    Application Error
                </h1>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                    {error?.message || "An unexpected system error occurred while processing this request."}
                </p>
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={reset}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all px-6 py-3 rounded-xl text-sm font-semibold cursor-pointer border-none"
                    >
                        Try Again
                    </button>
                    <a href="/"
                        className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 shadow-sm transition-all px-6 py-3 rounded-xl text-sm font-semibold cursor-pointer"
                    >
                        Go Home
                    </a>
                </div>
            </div>
        </div>
    )
}