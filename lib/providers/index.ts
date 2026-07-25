import { DeterministicAnalysisProvider } from "@/lib/providers/deterministic-provider";
import type { AnalysisProvider } from "@/lib/domain/types";

export async function getAnalysisProvider(): Promise<AnalysisProvider> {
  const providerName = process.env.AI_PROVIDER || "deterministic";
  const liveAiEnabled = process.env.ENABLE_LIVE_AI === "true";

  if (!liveAiEnabled || providerName === "deterministic") {
    return new DeterministicAnalysisProvider();
  }

  if (providerName === "deepseek") {
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error(
        "Live DeepSeek AI is enabled but no server-side DEEPSEEK_API_KEY is configured.",
      );
    }
    const { DeepSeekAnalysisProvider } = await import(
      "@/lib/providers/deepseek-provider"
    );
    return new DeepSeekAnalysisProvider();
  }

  if (providerName === "openai") {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "Live OpenAI is enabled but no server-side OPENAI_API_KEY is configured.",
      );
    }
    const { OpenAIAnalysisProvider } = await import(
      "@/lib/providers/openai-provider"
    );
    return new OpenAIAnalysisProvider();
  }

  throw new Error(`Unsupported live AI provider: ${providerName}`);
}
