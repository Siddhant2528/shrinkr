import { describe, it, expect } from "vitest";
import { API_URL, ROUTES } from "../lib/constants.js";

describe("constants", () => {
  describe("API_URL", () => {
    it("falls back to localhost when NEXT_PUBLIC_API_URL is not set", () => {
      // In test environment the env var is not set, so it should use the fallback
      expect(API_URL).toBe("http://localhost:8000");
    });

    it("is a valid URL string", () => {
      expect(() => new URL(API_URL)).not.toThrow();
    });
  });

  describe("ROUTES", () => {
    it("has all required route keys", () => {
      const required = ["HOME", "LOGIN", "REGISTER", "DASHBOARD", "LINKS", "ANALYTICS", "API_KEYS", "SETTINGS"];
      for (const key of required) {
        expect(ROUTES).toHaveProperty(key);
      }
    });

    it("all route values start with /", () => {
      for (const [key, value] of Object.entries(ROUTES)) {
        expect(value, `ROUTES.${key}`).toMatch(/^\//);
      }
    });

    it("HOME is /", () => {
      expect(ROUTES.HOME).toBe("/");
    });

    it("LOGIN is /login", () => {
      expect(ROUTES.LOGIN).toBe("/login");
    });
  });
});
