const fallbackApiBaseUrl = 'http://localhost:3001';

export function getApiBaseUrl() {
  const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
  const nodeEnv =
    typeof globalThis !== 'undefined' &&
    'process' in globalThis &&
    globalThis.process &&
    typeof globalThis.process === 'object' &&
    'env' in globalThis.process
      ? (globalThis.process.env as Record<string, string | undefined>)
      : undefined;

  return viteEnv?.VITE_API_BASE_URL ?? nodeEnv?.VITE_API_BASE_URL ?? fallbackApiBaseUrl;
}

export type HealthResponse = {
  service: string;
  status: string;
  timestamp: string;
};

export async function fetchHealth() {
  const response = await fetch(`${getApiBaseUrl()}/health`);

  if (!response.ok) {
    throw new Error(`Health request failed with status ${response.status}`);
  }

  return (await response.json()) as HealthResponse;
}
