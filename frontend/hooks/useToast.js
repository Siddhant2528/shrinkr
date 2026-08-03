"use client"

import { createContext, useContext, useState, useCallback } from "react"
import { formatErrorMessage } from "../lib/errorUtils"

export { formatErrorMessage }

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    const showToast = useCallback((message, type = "success") => {
        const id = Date.now()
        const cleanMessage = formatErrorMessage(message)
        setToasts((prev) => [...prev, { id, message: cleanMessage, type }])
        
        // Auto dismiss after 4 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id))
        }, 4000)
    }, [])

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast Container */}
            <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
                {toasts.map((toast) => {
                    let bgColor = "bg-white border-gray-100"
                    let icon = "ℹ️"
                    let textColor = "text-gray-800"
                    
                    if (toast.type === "success") {
                        bgColor = "bg-emerald-50 border-emerald-200"
                        icon = "✅"
                        textColor = "text-emerald-800"
                    } else if (toast.type === "error") {
                        bgColor = "bg-rose-50 border-rose-200"
                        icon = "❌"
                        textColor = "text-rose-800"
                    } else if (toast.type === "warning") {
                        bgColor = "bg-amber-50 border-amber-200"
                        icon = "⚠️"
                        textColor = "text-amber-800"
                    }

                    return (
                        <div
                            key={toast.id}
                            className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg ${bgColor} pointer-events-auto`}
                            style={{
                                animation: "slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                                transition: "all 0.2s ease"
                            }}
                        >
                            <span className="text-base flex-shrink-0">{icon}</span>
                            <div className="flex-1 text-sm font-medium leading-5 mr-2 break-words">
                                <p className={textColor}>{toast.message}</p>
                            </div>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="text-gray-400 hover:text-gray-600 font-bold text-xs p-0.5 leading-none transition-colors border-none bg-none cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>
                    )
                })}
            </div>
            {/* Inline keyframes animation definition */}
            <style jsx global>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(12px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
            `}</style>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider")
    }
    return context
}
