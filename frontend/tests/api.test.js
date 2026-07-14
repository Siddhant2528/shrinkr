import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Mock localStorage ──────────────────────────────────────────────────────────
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });
Object.defineProperty(globalThis, "window", { value: globalThis, writable: true });

// ── Mock fetch ─────────────────────────────────────────────────────────────────
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// Helper: build a mock Response
function mockResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

// ── Import AFTER globals are set ───────────────────────────────────────────────
const { authApi, urlApi, tagApi, apiKeyApi } = await import("../lib/api.js");

// ── Auth API ───────────────────────────────────────────────────────────────────
describe("authApi", () => {
  describe("register", () => {
    it("POSTs to /auth/register with email, username, password", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ detail: "OTP sent", email: "a@b.com" }));

      const result = await authApi.register("a@b.com", "alice", "password123");

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain("/auth/register");
      expect(opts.method).toBe("POST");
      expect(JSON.parse(opts.body)).toMatchObject({ email: "a@b.com", username: "alice" });
      expect(result.email).toBe("a@b.com");
    });
  });

  describe("login", () => {
    it("POSTs to /auth/login as form-urlencoded", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ access_token: "tok123", token_type: "bearer" }));

      const result = await authApi.login("a@b.com", "pass");

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain("/auth/login");
      expect(opts.headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
      expect(result.access_token).toBe("tok123");
    });
  });

  describe("me", () => {
    it("sends Authorization header when token is in localStorage", async () => {
      localStorageMock.setItem("token", "my-jwt");
      mockFetch.mockResolvedValueOnce(mockResponse({ id: 1, username: "alice" }));

      await authApi.me();

      const [, opts] = mockFetch.mock.calls[0];
      expect(opts.headers["Authorization"]).toBe("Bearer my-jwt");
    });
  });

  describe("verifyOtp", () => {
    it("POSTs email and otp to /auth/verify-otp", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ access_token: "tok" }));

      await authApi.verifyOtp("a@b.com", "123456");

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain("/auth/verify-otp");
      expect(JSON.parse(opts.body)).toMatchObject({ email: "a@b.com", otp: "123456" });
    });
  });

  describe("forgotPassword", () => {
    it("POSTs email to /auth/forgot-password", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ detail: "sent" }));

      await authApi.forgotPassword("a@b.com");

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain("/auth/forgot-password");
      expect(JSON.parse(opts.body)).toMatchObject({ email: "a@b.com" });
    });
  });

  describe("resetPassword", () => {
    it("POSTs email, otp, new_password to /auth/reset-password", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ detail: "reset" }));

      await authApi.resetPassword("a@b.com", "654321", "newpass");

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain("/auth/reset-password");
      const body = JSON.parse(opts.body);
      expect(body).toMatchObject({ email: "a@b.com", otp: "654321", new_password: "newpass" });
    });
  });
});

// ── URL API ────────────────────────────────────────────────────────────────────
describe("urlApi", () => {
  describe("shorten", () => {
    it("POSTs original_url to /shorten", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ short_code: "abc123", short_url: "http://localhost:8000/abc123" }));

      const result = await urlApi.shorten("https://example.com");

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain("/shorten");
      expect(opts.method).toBe("POST");
      expect(JSON.parse(opts.body).original_url).toBe("https://example.com");
      expect(result.short_code).toBe("abc123");
    });

    it("includes custom_slug when provided", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ short_code: "myslug" }));

      await urlApi.shorten("https://example.com", "myslug");

      const [, opts] = mockFetch.mock.calls[0];
      expect(JSON.parse(opts.body).custom_slug).toBe("myslug");
    });

    it("omits custom_slug when null", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ short_code: "abc" }));

      await urlApi.shorten("https://example.com", null);

      const [, opts] = mockFetch.mock.calls[0];
      // custom_slug should be undefined (omitted from JSON)
      expect(JSON.parse(opts.body)).not.toHaveProperty("custom_slug");
    });
  });

  describe("myLinks", () => {
    it("GETs /my-links with default params", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ items: [], total_items: 0, page: 1, total_pages: 1, limit: 50 }));

      await urlApi.myLinks();

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("/my-links");
      expect(url).toContain("page=1");
      expect(url).toContain("limit=50");
    });

    it("includes search param when provided", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ items: [] }));

      await urlApi.myLinks({ search: "example" });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain("search=example");
    });
  });

  describe("getQr", () => {
    it("returns the QR URL without fetching", () => {
      const url = urlApi.getQr("abc123");
      expect(url).toContain("/qr/abc123");
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});

// ── Tag API ────────────────────────────────────────────────────────────────────
describe("tagApi", () => {
  it("list GETs /tags", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse([]));

    await tagApi.list();

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("/tags");
  });

  it("create POSTs name and color to /tags", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: 1, name: "work", color: "#6366f1" }));

    await tagApi.create("work", "#6366f1");

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("/tags");
    expect(opts.method).toBe("POST");
    expect(JSON.parse(opts.body)).toMatchObject({ name: "work", color: "#6366f1" });
  });
});

// ── API Key API ────────────────────────────────────────────────────────────────
describe("apiKeyApi", () => {
  it("create POSTs name to /api-keys", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: 1, name: "my-key", key: "raw-key" }));

    await apiKeyApi.create("my-key");

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("/api-keys");
    expect(opts.method).toBe("POST");
    expect(JSON.parse(opts.body)).toMatchObject({ name: "my-key" });
  });

  it("revoke DELETEs /api-keys/{id}", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ message: "revoked" }));

    await apiKeyApi.revoke(42);

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("/api-keys/42");
    expect(opts.method).toBe("DELETE");
  });
});
