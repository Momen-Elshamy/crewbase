import { generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

function getProvider(providerName, modelId) {
  switch (providerName) {
    case 'openai': {
      const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
      return openai(modelId);
    }
    case 'google': {
      const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY });
      return google(modelId);
    }
    case 'anthropic':
    default: {
      const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      return anthropic(modelId || 'claude-sonnet-4-20250514');
    }
  }
}

function estimateCost(result) {
  const inputTokens = result.usage?.promptTokens || 0;
  const outputTokens = result.usage?.completionTokens || 0;
  // Rough estimate: $3/1M input, $15/1M output for Sonnet
  const cost = (inputTokens * 3 + outputTokens * 15) / 1_000_000;
  return Math.round(cost * 100);
}

export async function run(agent, systemPrompt, tools) {
  const providerName = agent.adapterConfig?.provider || 'anthropic';
  const modelId = agent.adapterConfig?.model || 'claude-sonnet-4-20250514';
  const model = getProvider(providerName, modelId);

  const result = await generateText({
    model,
    system: systemPrompt,
    prompt: 'Check your tasks and do your work. Use the tools available to you.',
    tools,
    maxSteps: agent.adapterConfig?.maxTurns || 10,
  });

  return {
    response: result.text || '',
    costCents: estimateCost(result),
  };
}
