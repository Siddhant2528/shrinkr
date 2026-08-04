"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import { authApi } from "@/lib/api"
import { useToast } from "@/hooks/useToast"

export default function SettingsPage() {
    const [user, setUser] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    // Password change state
    const [passwordForm, setPasswordForm] = useState({
        current_password: "",
        new_password: "",
        confirm_password: "",
    })
    const [passwordLoading, setPasswordLoading] = useState(false)
    const [passwordError, setPasswordError] = useState("")
    const [passwordSuccess, setPasswordSuccess] = useState("")
    
    const { showToast } = useToast()
    const [showCurrent, setShowCurrent] = useState(false)
    const [showNew, setShowNew] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    // Stats state
    const [stats, setStats] = useState(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [meData, statsData] = await Promise.all([
                    authApi.me(),
                    authApi.myStats(),
                ])
                setUser(meData)
                setStats(statsData)
            } catch (err) {
                console.error("Failed to load settings")
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [])

    const handlePasswordChange = (e) => {
        const { name, value } = e.target
        setPasswordForm(prev => ({ ...prev, [name]: value }))
        setPasswordError("")
        setPasswordSuccess("")
    }

    const handlePasswordSubmit = async (e) => {
        e.preventDefault()

        if (passwordForm.new_password !== passwordForm.confirm_password) {
            setPasswordError("New passwords do not match")
            showToast("New passwords do not match", "warning")
            return
        }

        if (passwordForm.new_password.length < 8) {
            setPasswordError("New password must be at least 8 characters")
            showToast("Password must be at least 8 characters", "warning")
            return
        }

        setPasswordLoading(true)
        setPasswordError("")
        setPasswordSuccess("")

        try {
            const data = await authApi.changePassword(
                passwordForm.current_password,
                passwordForm.new_password
            )

            if (data.detail && data.detail !== "Password changed successfully") {
                setPasswordError(data.detail)
                showToast(data.detail, "error")
                return
            }

            setPasswordSuccess("Password changed successfully")
            showToast("Password changed successfully!", "success")
            setPasswordForm({
                current_password: "",
                new_password: "",
                confirm_password: "",
            })

        } catch (err) {
            setPasswordError("Failed to change password")
            showToast("Failed to change password", "error")
        } finally {
            setPasswordLoading(false)
        }
    }

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="animate-pulse space-y-6 max-w-2xl">
                    <div className="h-8 bg-gray-100 rounded w-1/4" />
                    <div className="h-40 bg-gray-100 rounded-xl" />
                    <div className="h-64 bg-gray-100 rounded-xl" />
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="max-w-2xl space-y-6">

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Manage your account and preferences
                    </p>
                </div>

                {/* Profile card */}
                <div className="card p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">
                        Account
                    </h2>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 text-2xl font-bold">
                                {user?.username?.[0]?.toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 text-lg">
                                {user?.username}
                            </p>
                            <p className="text-gray-400 text-sm">{user?.email}</p>
                            {user?.is_admin && (
                                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-full">
                                    ⭐ Admin
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Account details */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                        <div>
                            <p className="text-xs text-gray-400 mb-1">Username</p>
                            <p className="text-sm font-medium text-gray-900">
                                {user?.username}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 mb-1">Email</p>
                            <p className="text-sm font-medium text-gray-900">
                                {user?.email}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 mb-1">Member since</p>
                            <p className="text-sm font-medium text-gray-900">
                                {user?.created_at
                                    ? new Date(user.created_at).toLocaleDateString("en-GB")
                                    : "—"}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 mb-1">Role</p>
                            <p className="text-sm font-medium text-gray-900">
                                {user?.is_admin ? "Administrator" : "Member"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats card */}
                {stats && (
                    <div className="card p-6">
                        <h2 className="text-base font-semibold text-gray-900 mb-4">
                            Your stats
                        </h2>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-blue-50 rounded-xl">
                                <p className="text-2xl font-bold text-blue-600">
                                    {stats.total_links || 0}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Total links</p>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-xl">
                                <p className="text-2xl font-bold text-green-600">
                                    {stats.total_clicks || 0}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Total clicks</p>
                            </div>
                            <div className="text-center p-4 bg-purple-50 rounded-xl">
                                <p className="text-2xl font-bold text-purple-600">
                                    {stats.active_links || 0}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Active links</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Change password */}
                <div className="card p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-1">
                        Change password
                    </h2>
                    <p className="text-sm text-gray-400 mb-5">
                        Use a strong password with at least 8 characters.
                    </p>

                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">
                                Current password
                            </label>
                            <div className="relative">
                                <input
                                    type={showCurrent ? "text" : "password"}
                                    name="current_password"
                                    value={passwordForm.current_password}
                                    onChange={handlePasswordChange}
                                    placeholder="••••••••"
                                    className="w-full border border-gray-200 rounded-lg pl-4 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={passwordLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrent(!showCurrent)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                                >
                                    {showCurrent ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"></path>
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">
                                New password
                            </label>
                            <div className="relative">
                                <input
                                    type={showNew ? "text" : "password"}
                                    name="new_password"
                                    value={passwordForm.new_password}
                                    onChange={handlePasswordChange}
                                    placeholder="••••••••"
                                    className="w-full border border-gray-200 rounded-lg pl-4 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={passwordLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew(!showNew)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                                >
                                    {showNew ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"></path>
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">
                                Confirm new password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirm ? "text" : "password"}
                                    name="confirm_password"
                                    value={passwordForm.confirm_password}
                                    onChange={handlePasswordChange}
                                    placeholder="••••••••"
                                    className="w-full border border-gray-200 rounded-lg pl-4 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={passwordLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                                >
                                    {showConfirm ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"></path>
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {passwordError && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                                <p className="text-red-600 text-sm">{passwordError}</p>
                            </div>
                        )}

                        {passwordSuccess && (
                            <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
                                <p className="text-green-600 text-sm">✓ {passwordSuccess}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={passwordLoading}
                            className="bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {passwordLoading ? "Updating..." : "Update password"}
                        </button>
                    </form>
                </div>

                {/* API info */}
                <div className="card p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">
                        API access
                    </h2>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                            <p className="text-sm font-medium text-gray-700">
                                API documentation
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                View all available endpoints
                            </p>
                        </div>
                        <a
                            href="https://shrinkr-w57o.onrender.com/docs"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Open docs →
                        </a>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mt-3">
                        <div>
                            <p className="text-sm font-medium text-gray-700">
                                Manage API keys
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Create and revoke API keys
                            </p>
                        </div>
                        <a
                            href="/api-keys"
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Go to keys →
                        </a>
                    </div>
                </div>

                {/* Danger zone */}
                <div className="card p-6 border border-red-100">
                    <h2 className="text-base font-semibold text-red-600 mb-1">
                        Danger zone
                    </h2>
                    <p className="text-sm text-gray-400 mb-4">
                        These actions are permanent and cannot be undone.
                    </p>

                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                        <div>
                            <p className="text-sm font-medium text-gray-700">
                                Sign out of all devices
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Invalidates all active sessions
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                localStorage.clear()
                                window.location.href = "/login"
                            }}
                            className="text-sm text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors font-medium"
                        >
                            Sign out
                        </button>
                    </div>
                </div>

            </div>
        </DashboardLayout>
    )
}