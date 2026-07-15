"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { authApi } from "@/lib/api"

// Decode JWT payload without a library
function decodeJwtPayload(token) {
    try {
        const base64 = token.split(".")[1]
        const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"))
        return JSON.parse(json)
    } catch {
        return null
    }
}

export function useAuth(redirectTo = "/login") {
    // Read from localStorage synchronously on initialization to avoid 1-frame loading flashes on client
    const getInitialUser = () => {
        if (typeof window === "undefined") return null
        const token = localStorage.getItem("token")
        if (!token) return null
        
        // Decode and verify exp synchronously
        const payload = decodeJwtPayload(token)
        if (payload?.exp && payload.exp * 1000 < Date.now()) {
            return null
        }
        
        return {
            token,
            username: localStorage.getItem("username"),
            email: localStorage.getItem("email"),
            isAdmin: localStorage.getItem("isAdmin") === "true",
            isVerified: localStorage.getItem("isVerified") === "true"
        }
    }

    const [user, setUser] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    // Schedule a proactive token refresh before expiry
    const scheduleRefresh = useCallback((token) => {
        const payload = decodeJwtPayload(token)
        if (!payload?.exp) return

        const expiresAt = payload.exp * 1000 // ms
        const now = Date.now()
        // Refresh 5 minutes before expiry (or immediately if < 5min left)
        const refreshIn = Math.max((expiresAt - now) - 5 * 60 * 1000, 0)

        const timer = setTimeout(async () => {
            const refreshed = await authApi.refresh()
            if (refreshed) {
                // Re-schedule with the new token
                const newToken = localStorage.getItem("token")
                if (newToken) scheduleRefresh(newToken)
            }
        }, refreshIn)

        return () => clearTimeout(timer)
    }, [])

    useEffect(() => {
        const token = localStorage.getItem("token")
        const username = localStorage.getItem("username")
        const email = localStorage.getItem("email")
        const isAdmin = localStorage.getItem("isAdmin") === "true"
        const isVerified = localStorage.getItem("isVerified") === "true"

        if (!token) {
            router.push(redirectTo)
            return
        }

        // Check if token is already expired
        const payload = decodeJwtPayload(token)
        if (payload?.exp && payload.exp * 1000 < Date.now()) {
            // Token expired — try a refresh
            authApi.refresh().then((refreshed) => {
                if (!refreshed) {
                    localStorage.removeItem("token")
                    localStorage.removeItem("username")
                    localStorage.removeItem("email")
                    localStorage.removeItem("isAdmin")
                    localStorage.removeItem("isVerified")
                    router.push(redirectTo)
                } else {
                    setUser({ token: localStorage.getItem("token"), username, email, isAdmin, isVerified })
                    setIsLoading(false)
                    scheduleRefresh(localStorage.getItem("token"))
                }
            })
            return
        }

        setUser({ token, username, email, isAdmin, isVerified })
        setIsLoading(false)

        // Background update check for verification state
        authApi.me().then((meData) => {
            if (meData && meData.username) {
                localStorage.setItem("isVerified", meData.is_verified)
                setUser(prev => prev ? { ...prev, isVerified: meData.is_verified } : null)
            }
        }).catch(err => console.error(err))

        // Schedule proactive refresh
        const cleanup = scheduleRefresh(token)
        return cleanup
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const logout = () => {
        localStorage.removeItem("token")
        localStorage.removeItem("username")
        localStorage.removeItem("email")
        localStorage.removeItem("isAdmin")
        localStorage.removeItem("isVerified")
        router.push("/login")
    }

    return { user, isLoading, logout }
}

export function useGuest(redirectTo = "/dashboard") {
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const token = localStorage.getItem("token")
        if (token) {
            router.push(redirectTo)
        } else {
            setIsLoading(false)
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    return { isLoading }
}