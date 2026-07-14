"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authApi } from "@/lib/api"
import Navbar from "@/components/Navbar"
import { useToast } from "@/hooks/useToast"

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [otpCode, setOtpCode] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [successMessage, setSuccessMessage] = useState("")
    const [showResetScreen, setShowResetScreen] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const router = useRouter()
    
    const { showToast } = useToast()

    const handleSendCode = async (e) => {
        e.preventDefault()

        if (!email) {
            setError("Please enter your email address")
            showToast("Email address is required", "warning")
            return
        }

        setError("")
        setIsLoading(true)

        try {
            const data = await authApi.forgotPassword(email)

            if (data.detail && data.detail.includes("code sent")) {
                setSuccessMessage("Verification code sent to your email.")
                showToast("Password reset code sent to your email!", "success")
                setShowResetScreen(true)
            } else if (data.detail) {
                setError(data.detail)
                showToast(data.detail, "error")
            } else {
                setError("Failed to request code. Please check your email and try again.")
                showToast("Request failed", "error")
            }
        } catch (err) {
            setError("Network error — please try again")
            showToast("Network error occurred", "error")
        } finally {
            setIsLoading(false)
        }
    }

    const handleResetPassword = async (e) => {
        e.preventDefault()

        if (!otpCode || otpCode.length !== 6) {
            setError("Please enter a valid 6-digit code")
            return
        }

        if (!newPassword || newPassword.length < 8) {
            setError("Password must be at least 8 characters")
            return
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        setError("")
        setIsLoading(true)
        setSuccessMessage("")

        try {
            const data = await authApi.resetPassword(email, otpCode, newPassword)

            if (data.detail && data.detail.includes("success")) {
                setSuccessMessage("Password reset successfully! Redirecting to login...")
                showToast("Password reset successfully! Redirecting to login...", "success")
                setTimeout(() => {
                    router.push("/login")
                }, 3000)
            } else if (data.detail) {
                setError(data.detail)
                showToast(data.detail, "error")
            } else {
                setError("Password reset failed. Please check the verification code.")
                showToast("Password reset failed", "error")
            }
        } catch (err) {
            setError("Network error — please try again")
            showToast("Network error occurred", "error")
        } finally {
            setIsLoading(false)
        }
    }

    const handleResendOtp = async () => {
        setError("")
        setSuccessMessage("")
        try {
            const res = await authApi.forgotPassword(email)
            setSuccessMessage(res.detail || "Verification code resent successfully!")
            showToast(res.detail || "Verification code resent successfully!", "success")
        } catch (err) {
            setError("Failed to resend code.")
            showToast("Failed to resend code", "error")
        }
    }

    return (
        <div className="min-h-screen bg-shrinkr-bg">
            <Navbar />

            <main className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4 py-12">
                <div className="w-full max-w-md">

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="text-4xl mb-4">🔐</div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {showResetScreen ? "Reset password" : "Forgot password"}
                        </h1>
                        <p className="text-gray-500 mt-2">
                            {showResetScreen
                                ? `We sent a reset code to ${email}`
                                : "Recover your password using your registered email"}
                        </p>
                    </div>

                    {/* Card */}
                    <div className="card p-8">
                        {showResetScreen ? (
                            <form onSubmit={handleResetPassword} className="space-y-5">
                                {/* Code input */}
                                <div>
                                    <label className="label text-center block mb-2">Enter the 6-digit code</label>
                                    <input
                                        type="text"
                                        maxLength="6"
                                        pattern="\d{6}"
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                                        placeholder="******"
                                        className="w-full border border-gray-200 rounded-lg p-3 text-center text-3xl font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                        disabled={isLoading}
                                        required
                                        autoFocus
                                    />
                                </div>

                                {/* New Password */}
                                <div>
                                    <label className="label">New password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="input pr-10"
                                            disabled={isLoading}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                                        >
                                            {showPassword ? (
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

                                {/* Confirm Password */}
                                <div>
                                    <label className="label">Confirm new password</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="input pr-10"
                                            disabled={isLoading}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                                        >
                                            {showConfirmPassword ? (
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
                                    {confirmPassword && newPassword === confirmPassword && (
                                        <p className="text-green-500 text-xs mt-1">
                                            ✓ Passwords match
                                        </p>
                                    )}
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                                        <p className="text-red-600 text-sm">{error}</p>
                                    </div>
                                )}

                                {successMessage && (
                                    <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
                                        <p className="text-green-600 text-sm">{successMessage}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading || otpCode.length !== 6}
                                    className="btn-primary w-full py-3"
                                >
                                    {isLoading ? "Resetting password..." : "Reset Password"}
                                </button>

                                <div className="flex items-center justify-between text-xs mt-4">
                                    <button
                                        type="button"
                                        onClick={handleResendOtp}
                                        className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                                    >
                                        Resend Code
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowResetScreen(false)}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        ← Back
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleSendCode} className="space-y-5">
                                {/* Email */}
                                <div>
                                    <label className="label">Email address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder=""
                                        className="input"
                                        disabled={isLoading}
                                        required
                                        autoFocus
                                    />
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                                        <p className="text-red-600 text-sm">{error}</p>
                                    </div>
                                )}

                                {successMessage && (
                                    <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
                                        <p className="text-green-600 text-sm">{successMessage}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="btn-primary w-full py-3"
                                >
                                    {isLoading ? "Sending code..." : "Send Verification Code"}
                                </button>
                            </form>
                        )}

                        {!showResetScreen && (
                            <>
                                <div className="relative my-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-100" />
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-3 bg-white text-gray-400">
                                            Remembered your password?
                                        </span>
                                    </div>
                                </div>

                                <Link href="/login"
                                    className="btn-secondary w-full py-3 text-center block">
                                    Back to sign in
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
