const fallbackApiBaseUrl = 'http://localhost:3001';

interface AppRuntimeEnv {
  VITE_API_BASE_URL?: string;
}

interface HealthResponse {
  service: string;
  status: string;
  timestamp: string;
}

function getNodeEnv(): AppRuntimeEnv | undefined {
  const runtime = globalThis as typeof globalThis & {
    process?: {
      env?: AppRuntimeEnv;
    };
  };

  return runtime.process?.env;
}

export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? getNodeEnv()?.VITE_API_BASE_URL ?? fallbackApiBaseUrl;
}

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${getApiBaseUrl()}/health`);

  if (!response.ok) {
    throw new Error(`Health request failed with status ${response.status}`);
  }

  return (await response.json()) as HealthResponse;
}

export type { HealthResponse };
