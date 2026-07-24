import { DeterministicAnalysisProvider } from "@/lib/providers/deterministic-provider";
import type { AnalysisProvider } from "@/lib/domain/types";

export async function getAnalysisProvider(): Promise<AnalysisProvider> {
  const wantsLiveProvider =
    process.env.AI_PROVIDER === "openai" &&
    process.env.ENABLE_LIVE_AI === "true";

  if (!wantsLiveProvider) {
    return new DeterministicAnalysisProvider();
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "Live AI is enabled but no server-side OPENAI_API_KEY is configured.",
    );
  }

  const { OpenAIAnalysisProvider } = await import(
    "@/lib/providers/openai-provider"
  );
  return new OpenAIAnalysisProvider();
}
