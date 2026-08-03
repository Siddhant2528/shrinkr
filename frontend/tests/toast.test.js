import { describe, it, expect } from "vitest";
import { formatErrorMessage } from "../lib/errorUtils";

describe("formatErrorMessage", () => {
  it("returns plain string as is", () => {
    expect(formatErrorMessage("Simple error")).toBe("Simple error");
  });

  it("formats Pydantic 422 array of objects into readable text", () => {
    const pydanticError = [
      {
        type: "url_parsing",
        loc: ["body", "original_url"],
        msg: "Input should be a valid URL",
        input: "www.geeksforgeeks.org/dsa",
      },
    ];
    expect(formatErrorMessage(pydanticError)).toBe("original_url: Input should be a valid URL");
  });

  it("handles empty or null input gracefully", () => {
    expect(formatErrorMessage(null)).toBe("");
    expect(formatErrorMessage(undefined)).toBe("");
  });
});
