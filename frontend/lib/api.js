import { API_URL } from "./constants"

// Get token from localStorage
const getToken = () => {
    if (typeof window === "undefined") return null
    return localStorage.getItem("token")
}

// Save token to localStorage
const setToken = (token) => {
    if (typeof window === "undefined") return
    localStorage.setItem("token", token)
}

// Track if a refresh is already in-flight to avoid loops
let isRefreshing = false
let refreshPromise = null

// Try to refresh the token
const tryRefreshToken = async () => {
    if (isRefreshing) return refreshPromise

    isRefreshing = true
    refreshPromise = (async () => {
        try {
            const token = getToken()
            if (!token) return false

            const response = await fetch(`${API_URL}/auth/refresh`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            })

            if (!response.ok) return false

            const data = await response.json()
            if (data.access_token) {
                setToken(data.access_token)
                return true
            }
            return false
        } catch {
            return false
        } finally {
            isRefreshing = false
            refreshPromise = null
        }
    })()

    return refreshPromise
}

// Base fetch function with auth + automatic token refresh on 401
const apiFetch = async (endpoint, options = {}, _retried = false) => {
    const token = getToken()

    const headers = {
        "Content-Type": "application/json",
        ...(token && { "Authorization": `Bearer ${token}` }),
        ...options.headers,
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    })

    // If we get a 401 and haven't retried yet, try refreshing the token
    if (response.status === 401 && !_retried && token) {
        const refreshed = await tryRefreshToken()
        if (refreshed) {
            return apiFetch(endpoint, options, true)
        }
        // Refresh failed — clear auth and redirect to login
        if (typeof window !== "undefined") {
            localStorage.removeItem("token")
            localStorage.removeItem("username")
            localStorage.removeItem("email")
            localStorage.removeItem("isAdmin")
            window.location.href = "/login"
        }
    }

    return response
}

// ─── Auth endpoints ────────────────────────────────────────────────────────────
export const authApi = {
    register: async (email, username, password) => {
        const res = await apiFetch("/auth/register", {
            method: "POST",
            body: JSON.stringify({ email, username, password }),
        })
        return res.json()
    },

    login: async (email, password) => {
        const formData = new URLSearchParams()
        formData.append("username", email)
        formData.append("password", password)

        const res = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formData,
        })
        return res.json()
    },

    me: async () => {
        const res = await apiFetch("/auth/me")
        return res.json()
    },

    myStats: async () => {
        const res = await apiFetch("/auth/my-stats")
        return res.json()
    },

    changePassword: async (currentPassword, newPassword) => {
        const res = await apiFetch("/auth/change-password", {
            method: "POST",
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword,
            }),
        })
        return res.json()
    },

    refresh: async () => {
        const refreshed = await tryRefreshToken()
        return refreshed
    },

    verifyOtp: async (email, otp) => {
        const res = await apiFetch("/auth/verify-otp", {
            method: "POST",
            body: JSON.stringify({ email, otp }),
        })
        return res.json()
    },

    resendOtp: async (email) => {
        const res = await apiFetch("/auth/resend-otp", {
            method: "POST",
            body: JSON.stringify({ email }),
        })
        return res.json()
    },

    forgotPassword: async (email) => {
        const res = await apiFetch("/auth/forgot-password", {
            method: "POST",
            body: JSON.stringify({ email }),
        })
        return res.json()
    },

    resetPassword: async (email, otp, newPassword) => {
        const res = await apiFetch("/auth/reset-password", {
            method: "POST",
            body: JSON.stringify({ email, otp, new_password: newPassword }),
        })
        return res.json()
    },
}

// ─── URL endpoints ────────────────────────────────────────────────────────────
export const urlApi = {
    shorten: async (originalUrl, customSlug = null, expiresInDays = null) => {
        const res = await apiFetch("/shorten", {
            method: "POST",
            body: JSON.stringify({
                original_url: originalUrl,
                custom_slug: customSlug || undefined,
                expires_in_days: expiresInDays || undefined,
            }),
        })
        return res.json()
    },

    /**
     * Paginated links list.
     * @param {Object} opts
     * @param {number} [opts.page=1]
     * @param {number} [opts.limit=50]
     * @param {string} [opts.search]
     * @param {number} [opts.tagId]
     * @param {boolean} [opts.showArchived=false]
     * @param {boolean} [opts.favoritesOnly=false]
     * @param {string} [opts.sortBy="newest"]
     */
    myLinks: async ({ page = 1, limit = 50, search, tagId, showArchived = false, favoritesOnly = false, sortBy = "newest" } = {}) => {
        const params = new URLSearchParams()
        params.set("page", String(page))
        params.set("limit", String(limit))
        if (search) params.set("search", search)
        if (tagId != null) params.set("tag_id", String(tagId))
        if (showArchived) params.set("show_archived", "true")
        if (favoritesOnly) params.set("favorites_only", "true")
        if (sortBy) params.set("sort_by", sortBy)

        const res = await apiFetch(`/my-links?${params.toString()}`)
        return res.json()
    },

    /** Archive a link (replaces delete). */
    archiveLink: async (shortCode) => {
        const res = await apiFetch(`/my-links/${shortCode}/archive`, {
            method: "PATCH",
        })
        return res.json()
    },

    /** Toggle the is_favorite flag on a link. */
    toggleFavorite: async (shortCode) => {
        const res = await apiFetch(`/my-links/${shortCode}/favorite`, {
            method: "PATCH",
        })
        return res.json()
    },

    updateLink: async (shortCode, originalUrl) => {
        const res = await apiFetch(`/my-links/${shortCode}`, {
            method: "PATCH",
            body: JSON.stringify({ original_url: originalUrl }),
        })
        return res.json()
    },

    getQr: (shortCode) => `${API_URL}/qr/${shortCode}`,
}

// ─── Analytics endpoints ──────────────────────────────────────────────────────
export const analyticsApi = {
    getAnalytics: async (shortCode) => {
        const res = await apiFetch(`/analytics/${shortCode}`)
        return res.json()
    },

    getTimeseries: async (shortCode, days = 30) => {
        const res = await apiFetch(`/analytics/${shortCode}/timeseries?days=${days}`)
        return res.json()
    },
}

// ─── Dashboard endpoints ──────────────────────────────────────────────────────
export const dashboardApi = {
    getSummary: async () => {
        const res = await apiFetch("/dashboard")
        return res.json()
    },

    getSummaryOnly: async () => {
        const res = await apiFetch("/dashboard/summary")
        return res.json()
    },

    getCountries: async () => {
        const res = await apiFetch("/dashboard/countries")
        return res.json()
    },

    getDevices: async () => {
        const res = await apiFetch("/dashboard/devices")
        return res.json()
    },

    getTopLinks: async () => {
        const res = await apiFetch("/dashboard/top-links")
        return res.json()
    },

    getRecentClicks: async () => {
        const res = await apiFetch("/dashboard/recent")
        return res.json()
    },
}

// ─── API Keys endpoints ───────────────────────────────────────────────────────
export const apiKeyApi = {
    list: async () => {
        const res = await apiFetch("/api-keys")
        return res.json()
    },

    create: async (name) => {
        const res = await apiFetch("/api-keys", {
            method: "POST",
            body: JSON.stringify({ name }),
        })
        return res.json()
    },

    revoke: async (keyId) => {
        const res = await apiFetch(`/api-keys/${keyId}`, {
            method: "DELETE",
        })
        return res.json()
    },
}

// ─── Tags endpoints ───────────────────────────────────────────────────────────
export const tagApi = {
    list: async () => {
        const res = await apiFetch("/tags")
        return res.json()
    },

    create: async (name, color = "#6366f1") => {
        const res = await apiFetch("/tags", {
            method: "POST",
            body: JSON.stringify({ name, color }),
        })
        return res.json()
    },

    delete: async (tagId) => {
        await apiFetch(`/tags/${tagId}`, { method: "DELETE" })
    },

    setLinkTags: async (shortCode, tagIds) => {
        const res = await apiFetch(`/tags/links/${shortCode}`, {
            method: "PUT",
            body: JSON.stringify({ tag_ids: tagIds }),
        })
        return res.json()
    },
}

// ─── Custom Domains endpoints ─────────────────────────────────────────────────
export const domainApi = {
    list: async () => {
        const res = await apiFetch("/domains")
        return res.json()
    },

    create: async (domain, verificationType = "txt") => {
        const res = await apiFetch("/domains", {
            method: "POST",
            body: JSON.stringify({ domain, verification_type: verificationType }),
        })
        return res.json()
    },

    delete: async (domainId) => {
        await apiFetch(`/domains/${domainId}`, { method: "DELETE" })
    },

    verify: async (domainId) => {
        const res = await apiFetch(`/domains/${domainId}/verify`, { method: "POST" })
        return res.json()
    },
}