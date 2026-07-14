"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authApi } from "@/lib/api"
import Navbar from "@/components/Navbar"
import { useToast } from "@/hooks/useToast"

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        email: "",
        username: "",
        password: "",
        confirmPassword: "",
    })
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [fieldErrors, setFieldErrors] = useState({})
    const router = useRouter()

    // OTP verification states
    const [showOtpScreen, setShowOtpScreen] = useState(false)
    const [otpCode, setOtpCode] = useState("")
    const [otpLoading, setOtpLoading] = useState(false)
    const [otpSuccess, setOtpSuccess] = useState("")
    const [registeredEmail, setRegisteredEmail] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    
    const { showToast } = useToast()

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: "" }))
        }
    }

    const validate = () => {
        const errors = {}

        if (!formData.email) {
            errors.email = "Email is required"
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = "Enter a valid email address"
        }

        if (!formData.username) {
            errors.username = "Username is required"
        } else if (formData.username.length < 3) {
            errors.username = "Username must be at least 3 characters"
        } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
            errors.username = "Username can only contain letters, numbers, underscores"
        }

        if (!formData.password) {
            errors.password = "Password is required"
        } else if (formData.password.length < 8) {
            errors.password = "Password must be at least 8 characters"
        }

        if (!formData.confirmPassword) {
            errors.confirmPassword = "Please confirm your password"
        } else if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = "Passwords do not match"
        }

        return errors
    }

    const handleRegister = async (e) => {
        e.preventDefault()

        const errors = validate()
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors)
            return
        }

        setError("")
        setIsLoading(true)

        try {
            const data = await authApi.register(
                formData.email,
                formData.username,
                formData.password
            )

            if (data.detail && data.detail.includes("OTP sent")) {
                setRegisteredEmail(formData.email)
                showToast("Account created! Verification code sent to your email.", "success")
                setShowOtpScreen(true)
            } else if (data.detail) {
                setError(data.detail)
                showToast(data.detail, "error")
            } else {
                setError("Registration failed — please try again.")
                showToast("Registration failed", "error")
            }

        } catch (err) {
            setError("Network error — please try again")
            showToast("Network error during registration", "error")
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
            const data = await authApi.verifyOtp(registeredEmail, otpCode)

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
                showToast("Email verified! Welcome to Shrinkr.", "success")
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
            const res = await authApi.resendOtp(registeredEmail)
            setOtpSuccess(res.detail || "Verification code resent successfully!")
            showToast(res.detail || "Verification code resent successfully!", "success")
        } catch (err) {
            setError("Failed to resend code.")
            showToast("Failed to resend code", "error")
        }
    }

    const getPasswordStrength = (password) => {
        if (!password) return null
        if (password.length < 6) return { label: "Weak", color: "bg-red-500", width: "w-1/4" }
        if (password.length < 10) return { label: "Fair", color: "bg-yellow-500", width: "w-2/4" }
        if (password.length < 14) return { label: "Good", color: "bg-blue-500", width: "w-3/4" }
        return { label: "Strong", color: "bg-green-500", width: "w-full" }
    }

    const strength = getPasswordStrength(formData.password)

    return (
        <div className="min-h-screen bg-shrinkr-bg">
            <Navbar />

            <main className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4 py-12">
                <div className="w-full max-w-md">

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="text-4xl mb-4">🔗</div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {showOtpScreen ? "Verify your email" : "Create your account"}
                        </h1>
                        <p className="text-gray-500 mt-2">
                            {showOtpScreen
                                ? `We sent a 6-digit code to ${registeredEmail}`
                                : "Start shortening URLs for free"}
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
                                        ← Back to register
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleRegister} className="space-y-5">
                                {/* Email */}
                                <div>
                                    <label className="label">Email address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder=""
                                        className={`input ${fieldErrors.email ? "border-red-300 focus:ring-red-500" : ""}`}
                                        disabled={isLoading}
                                    />
                                    {fieldErrors.email && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {fieldErrors.email}
                                        </p>
                                    )}
                                </div>

                                {/* Username */}
                                <div>
                                    <label className="label">Username</label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        placeholder=""
                                        className={`input ${fieldErrors.username ? "border-red-300 focus:ring-red-500" : ""}`}
                                        disabled={isLoading}
                                    />
                                    {fieldErrors.username && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {fieldErrors.username}
                                        </p>
                                    )}
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="label">Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="••••••••"
                                            className={`input pr-10 ${fieldErrors.password ? "border-red-300 focus:ring-red-500" : ""}`}
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

                                    {strength && (
                                        <div className="mt-2">
                                            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all ${strength.color} ${strength.width}`} />
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Password strength:{" "}
                                                <span className="font-medium text-gray-600">
                                                    {strength.label}
                                                </span>
                                            </p>
                                        </div>
                                    )}

                                    {fieldErrors.password && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {fieldErrors.password}
                                        </p>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="label">Confirm password</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            placeholder="••••••••"
                                            className={`input pr-10 ${fieldErrors.confirmPassword ? "border-red-300 focus:ring-red-500" : ""}`}
                                            disabled={isLoading}
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
                                    {formData.confirmPassword &&
                                        formData.password === formData.confirmPassword && (
                                            <p className="text-green-500 text-xs mt-1">
                                                ✓ Passwords match
                                            </p>
                                        )}
                                    {fieldErrors.confirmPassword && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {fieldErrors.confirmPassword}
                                        </p>
                                    )}
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                                        <p className="text-red-600 text-sm">{error}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="btn-primary w-full py-3"
                                >
                                    {isLoading ? "Creating account..." : "Create account"}
                                </button>
                            </form>
                        )}

                        {!showOtpScreen && (
                            <>
                                <div className="relative my-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-100" />
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-3 bg-white text-gray-400">
                                            Already have an account?
                                        </span>
                                    </div>
                                </div>

                                <Link href="/login"
                                    className="btn-secondary w-full py-3 text-center block">
                                    Sign in instead
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}