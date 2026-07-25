import { afterEach, describe, expect, it, vi } from "vitest";

import { getAnalysisProvider } from "@/lib/providers";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("analysis provider routing", () => {
  it("defaults to the deterministic provider", async () => {
    vi.stubEnv("AI_PROVIDER", "");
    vi.stubEnv("ENABLE_LIVE_AI", "false");

    await expect(getAnalysisProvider()).resolves.toMatchObject({
      kind: "deterministic",
    });
  });

  it("keeps live providers disabled behind the explicit safety gate", async () => {
    vi.stubEnv("AI_PROVIDER", "deepseek");
    vi.stubEnv("ENABLE_LIVE_AI", "false");
    vi.stubEnv("DEEPSEEK_API_KEY", "");

    await expect(getAnalysisProvider()).resolves.toMatchObject({
      kind: "deterministic",
    });
  });

  it("requires a server-side DeepSeek key when live mode is enabled", async () => {
    vi.stubEnv("AI_PROVIDER", "deepseek");
    vi.stubEnv("ENABLE_LIVE_AI", "true");
    vi.stubEnv("DEEPSEEK_API_KEY", "");

    await expect(getAnalysisProvider()).rejects.toThrow(
      "DEEPSEEK_API_KEY",
    );
  });

  it("selects DeepSeek V4 Flash when its live gate is complete", async () => {
    vi.stubEnv("AI_PROVIDER", "deepseek");
    vi.stubEnv("ENABLE_LIVE_AI", "true");
    vi.stubEnv("DEEPSEEK_API_KEY", "test-key-not-real");
    vi.stubEnv("DEEPSEEK_MODEL", "deepseek-v4-flash");

    await expect(getAnalysisProvider()).resolves.toMatchObject({
      kind: "deepseek",
      model: "deepseek-v4-flash",
    });
  });

  it("rejects an unsupported live provider instead of silently falling back", async () => {
    vi.stubEnv("AI_PROVIDER", "unknown-provider");
    vi.stubEnv("ENABLE_LIVE_AI", "true");

    await expect(getAnalysisProvider()).rejects.toThrow(
      "Unsupported live AI provider",
    );
  });
});
