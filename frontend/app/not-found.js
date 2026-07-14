import Link from "next/link"

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 relative overflow-hidden">
            {/* Ambient background glows */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-100/50 filter blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/3 w-80 h-80 rounded-full bg-purple-100/40 filter blur-3xl pointer-events-none" />

            <div className="text-center max-w-md relative z-10 animate-fadeIn">
                <p className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 select-none leading-none mb-4">404</p>
                <h1 className="text-2xl font-bold text-gray-900 mb-3">
                    Lost in Space
                </h1>
                <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                    The short link or page you are trying to reach doesn't exist, has expired, or has been relocated to another address.
                </p>
                <div className="flex items-center justify-center gap-3">
                    <Link href="/"
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all px-6 py-3 rounded-xl text-sm font-semibold cursor-pointer">
                        Go Home
                    </Link>
                    <Link href="/dashboard"
                        className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 shadow-sm transition-all px-6 py-3 rounded-xl text-sm font-semibold cursor-pointer">
                        Dashboard
                    </Link>
                </div>
            </div>
        </div>
    )
}