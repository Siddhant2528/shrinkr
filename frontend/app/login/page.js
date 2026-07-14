"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authApi } from "@/lib/api"
import Navbar from "@/components/Navbar"
import { useToast } from "@/hooks/useToast"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const router = useRouter()

    // OTP verification states
    const [showOtpScreen, setShowOtpScreen] = useState(false)
    const [otpCode, setOtpCode] = useState("")
    const [otpLoading, setOtpLoading] = useState(false)
    const [otpSuccess, setOtpSuccess] = useState("")
    const { showToast } = useToast()

    const handleLogin = async (e) => {
        e.preventDefault()

        if (!email || !password) {
            setError("Please fill in all fields")
            showToast("Please fill in all fields", "warning")
            return
        }

        setError("")
        setIsLoading(true)

        try {
            const data = await authApi.login(email, password)

            if (data.detail === "Email verification required") {
                setOtpSuccess("A 6-digit verification code was sent to your email address.")
                showToast("Email verification required. Code sent to your inbox.", "warning")
                setShowOtpScreen(true)
                return
            }

            if (data.detail || !data.access_token) {
                setError(data.detail || "Login failed — please try again")
                showToast(data.detail || "Login failed", "error")
                return
            }

            // Store token and username
            localStorage.setItem("token", data.access_token)

            // Fetch user info
            const userRes = await authApi.me()
            if (userRes.username) {
                localStorage.setItem("username", userRes.username)
                localStorage.setItem("email", userRes.email)
                localStorage.setItem("isAdmin", userRes.is_admin)
                localStorage.setItem("isVerified", userRes.is_verified)
            }

            // Redirect to dashboard
            showToast("Logged in successfully!", "success")
            router.push("/dashboard")

        } catch (err) {
            setError("Network error — please try again")
            showToast("Network error during login", "error")
        } finally {
            setIsLoading(false)
        }
    }

    const handleVerifyOtp = async (e) => {
        e.preventDefault()

        if (!otpCode || otpCode.length !== 6) {
            setError("Please enter a valid 6-digit code")
            return
        }

        setError("")
        setOtpLoading(true)
        setOtpSuccess("")

        try {
            const data = await authApi.verifyOtp(email, otpCode)

            if (data.detail) {
                setError(data.detail)
                showToast(data.detail, "error")
                return
            }

            if (data.access_token) {
                localStorage.setItem("token", data.access_token)
                
                const userRes = await authApi.me()
                if (userRes.username) {
                    localStorage.setItem("username", userRes.username)
                    localStorage.setItem("email", userRes.email)
                    localStorage.setItem("isAdmin", userRes.is_admin)
                    localStorage.setItem("isVerified", userRes.is_verified)
                }

            // Redirect to dashboard
                showToast("Email verified and signed in!", "success")
                router.push("/dashboard")
            } else {
                setError("Verification succeeded, but login failed. Please sign in manually.")
                showToast("Verification succeeded. Please log in manually.", "warning")
            }
        } catch (err) {
            setError("Network error — please try again")
            showToast("Network error during verification", "error")
        } finally {
            setOtpLoading(false)
        }
    }

    const handleResendOtp = async () => {
        setError("")
        setOtpSuccess("")
        try {
            const res = await authApi.resendOtp(email)
            setOtpSuccess(res.detail || "Verification code resent successfully!")
            showToast(res.detail || "Verification code resent successfully!", "success")
        } catch (err) {
            setError("Failed to resend code.")
            showToast("Failed to resend code", "error")
        }
    }

    return (
        <div className="min-h-screen bg-shrinkr-bg">
            <Navbar />

            <main className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
                <div className="w-full max-w-md">

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="text-4xl mb-4">🔗</div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {showOtpScreen ? "Verify your email" : "Welcome back"}
                        </h1>
                        <p className="text-gray-500 mt-2">
                            {showOtpScreen
                                ? `We sent a 6-digit code to ${email}`
                                : "Sign in to your Shrinkr account"}
                        </p>
                    </div>

                    {/* Card */}
                    <div className="card p-8">
                        {showOtpScreen ? (
                            <form onSubmit={handleVerifyOtp} className="space-y-5">
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
                                        disabled={otpLoading}
                                        required
                                        autoFocus
                                    />
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                                        <p className="text-red-600 text-sm">{error}</p>
                                    </div>
                                )}

                                {otpSuccess && (
                                    <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
                                        <p className="text-green-600 text-sm">{otpSuccess}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={otpLoading || otpCode.length !== 6}
                                    className="btn-primary w-full py-3"
                                >
                                    {otpLoading ? "Verifying..." : "Verify Code"}
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
                                        onClick={() => setShowOtpScreen(false)}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        ← Back to sign in
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleLogin} className="space-y-5">
                                {/* Email */}
                                <div>
                                    <label className="label">Email address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder=""
                                        className="input"
                                        autoComplete="email"
                                        disabled={isLoading}
                                    />
                                </div>

                                {/* Password */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="label mb-0">Password</label>
                                        <Link
                                            href="/forgot-password"
                                            className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="input pr-10"
                                            autoComplete="current-password"
                                            disabled={isLoading}
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

                                {/* Error */}
                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                                        <p className="text-red-600 text-sm">{error}</p>
                                    </div>
                                )}

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="btn-primary w-full py-3"
                                >
                                    {isLoading ? "Signing in..." : "Sign in"}
                                </button>
                            </form>
                        )}

                        {!showOtpScreen && (
                            <>
                                {/* Divider */}
                                <div className="relative my-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-100" />
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-3 bg-white text-gray-400">
                                            New to Shrinkr?
                                        </span>
                                    </div>
                                </div>

                                {/* Register link */}
                                <Link href="/register"
                                    className="btn-secondary w-full py-3 text-center block">
                                    Create an account
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Footer note */}
                    <p className="text-center text-xs text-gray-400 mt-6">
                        By signing in you agree to our terms of service.
                    </p>

                </div>
            </main>
        </div>
    )
}