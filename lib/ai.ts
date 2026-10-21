// Backend-only provider transport. Do not import into web or Swift clients.
export const DEFAULT_AI_MODEL = 'deepseek/deepseek-v4.1-flash-1017';
export type AIConfig = { provider: 'vercel'; model: string; configured: boolean; valid: boolean };
export function aiConfig(): AIConfig {
  const model = process.env.AI_GATEWAY_MODEL?.trim() || DEFAULT_AI_MODEL;
  return { provider: 'vercel', model, configured: Boolean(process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_OIDC_TOKEN?.trim()), valid: /^deepseek\/[a-z0-9][a-z0-9.-]{0,99}$/.test(model) };
}
export function aiFailureReason(status: number) {
  return status === 401 ? 'invalid-api-key' : status === 402 ? 'credits-exhausted' : status === 403 ? 'model-access-denied' : status === 429 ? 'rate-limited' : 'provider-unavailable';
}
type StructuredRequest = { system: string; context: unknown; schema: Record<string, unknown>; maxOutputTokens: number; timeoutMs: number; signal?: AbortSignal };
export type AIResult = { ok: true; value: unknown; source: 'gateway'; model: string } | { ok: false; reason: string; model: string; providerStatus?: number };
export async function generateStructured(request: StructuredRequest): Promise<AIResult> {
  const config = aiConfig();
  const fail = (reason: string, providerStatus?: number): AIResult => ({ ok: false, reason, model: config.model, ...(providerStatus ? { providerStatus } : {}) });
  if (!config.valid) return fail('invalid-configuration');
  if (!config.configured) return fail('not-configured');
  // An API key takes precedence. Never try another credential or model after failure.
  const token = process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_OIDC_TOKEN!.trim();
  try {
    const timeout = AbortSignal.timeout(request.timeoutMs);
    const response = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
      method: 'POST', cache: 'no-store', signal: request.signal ? AbortSignal.any([request.signal, timeout]) : timeout,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        model: config.model, stream: false,
        messages: [{ role: 'system', content: request.system }, { role: 'user', content: JSON.stringify(request.context) }],
        max_tokens: request.maxOutputTokens, temperature: 0.2,
        reasoning: { effort: 'none', exclude: true },
        response_format: { type: 'json_schema', json_schema: { name: 'rethink_response', schema: request.schema } },
      }),
    });
    if (!response.ok) return fail(aiFailureReason(response.status), response.status);
    // Read only the final assistant content. Never return reasoning or provider errors.
    const data = await response.json();
    const choice = data?.choices?.[0];
    if (choice?.finish_reason && choice.finish_reason !== 'stop') return fail('invalid-response');
    const content = choice?.message?.content;
    if (typeof content !== 'string' || content.length > 16000 || choice?.message?.refusal) return fail('invalid-response');
    let value: unknown;
    try { value = JSON.parse(content); } catch { return fail('invalid-response'); }
    return { ok: true, value, source: 'gateway', model: config.model };
  } catch { return fail('provider-unavailable'); }
}
