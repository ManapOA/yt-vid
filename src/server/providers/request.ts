export async function fetchWithTimeout(
  input: string | URL,
  init: RequestInit,
  timeoutMs: number
) {
  return fetch(input, {
    ...init,
    signal: AbortSignal.timeout(timeoutMs)
  });
}
