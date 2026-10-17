export const geminiFailureReason = (status: number) => status === 401 ? 'invalid-api-key' : status === 429 ? 'rate-limited' : 'provider-unavailable';
