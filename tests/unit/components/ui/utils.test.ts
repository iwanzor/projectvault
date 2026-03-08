import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility", () => {
  it("merges class names", () => {
    const result = cn("foo", "bar");
    expect(result).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    const result = cn("base", false && "hidden", "visible");
    expect(result).toBe("base visible");
  });

  it("handles undefined and null inputs", () => {
    const result = cn("base", undefined, null, "end");
    expect(result).toBe("base end");
  });

  it("merges Tailwind classes correctly (last wins)", () => {
    const result = cn("px-4", "px-6");
    expect(result).toBe("px-6");
  });

  it("handles empty input", () => {
    const result = cn();
    expect(result).toBe("");
  });

  it("handles array inputs via clsx", () => {
    const result = cn(["foo", "bar"]);
    expect(result).toBe("foo bar");
  });
});
