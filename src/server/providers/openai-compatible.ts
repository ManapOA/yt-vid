import { parseStructuredJson } from './json';
import { repairMojibakeDeep } from '../utils';
import { config as appConfig } from '../config';
import { fetchWithTimeout } from './request';

export type OpenAiCompatibleConfig = {
  providerName: string;
  apiKey: string;
  model: string;
  baseUrl: string;
  siteUrl?: string;
  appName?: string;
  maxCompletionTokens?: number;
  responseFormat?: unknown;
};

export async function generateWithOpenAiCompatible<T>({
  prompt,
  fallback,
  schema,
  config
}: {
  prompt: string;
  fallback: T;
  schema: { parse: (value: unknown) => T };
  config: OpenAiCompatibleConfig;
}) {
  if (!config.apiKey) return repairMojibakeDeep(fallback);

  let response: Response;
  try {
    response = await fetchWithTimeout(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        ...(config.siteUrl ? { 'HTTP-Referer': config.siteUrl } : {}),
        ...(config.appName ? { 'X-Title': config.appName } : {})
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.9,
        max_completion_tokens: config.maxCompletionTokens || 1800,
        response_format: config.responseFormat || { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'Return valid JSON only. No markdown, no explanations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    }, appConfig.llmRequestTimeoutMs);
  } catch (error) {
    console.warn(`[${config.providerName}] request failed, using fallback: ${error instanceof Error ? error.message : String(error)}`);
    return repairMojibakeDeep(fallback);
  }

  if (!response.ok) {
    console.warn(`[${config.providerName}] ${response.status} ${response.statusText}, using fallback: ${(await response.text()).slice(0, 240)}`);
    return repairMojibakeDeep(fallback);
  }

  try {
    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (!content) {
      console.warn(`[${config.providerName}] empty response content, using fallback`);
      return repairMojibakeDeep(fallback);
    }
    return repairMojibakeDeep(parseStructuredJson(content, schema));
  } catch (error) {
    console.warn(`[${config.providerName}] invalid response, using fallback: ${error instanceof Error ? error.message : String(error)}`);
    return repairMojibakeDeep(fallback);
  }
}

export async function generatePlainWithOpenAiCompatible({
  prompt,
  fallback,
  config,
  temperature = 0.2,
  maxCompletionTokens = 220
}: {
  prompt: string;
  fallback: string;
  config: OpenAiCompatibleConfig;
  temperature?: number;
  maxCompletionTokens?: number;
}) {
  if (!config.apiKey) return fallback;

  try {
    const response = await fetchWithTimeout(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        ...(config.siteUrl ? { 'HTTP-Referer': config.siteUrl } : {}),
        ...(config.appName ? { 'X-Title': config.appName } : {})
      },
      body: JSON.stringify({
        model: config.model,
        temperature,
        max_completion_tokens: maxCompletionTokens,
        messages: [
          { role: 'system', content: 'Return only the requested text.' },
          { role: 'user', content: prompt }
        ]
      })
    }, appConfig.llmRequestTimeoutMs);

    if (!response.ok) {
      console.warn(`[${config.providerName}] ${response.status} ${response.statusText}, using fallback: ${(await response.text()).slice(0, 240)}`);
      return fallback;
    }

    const payload = await response.json();
    return payload?.choices?.[0]?.message?.content?.trim() || fallback;
  } catch (error) {
    console.warn(`[${config.providerName}] request failed, using fallback: ${error instanceof Error ? error.message : String(error)}`);
    return fallback;
  }
}
