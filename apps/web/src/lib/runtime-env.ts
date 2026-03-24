const fallbackApiBaseUrl = 'http://localhost:3001';
const fallbackCustomerExternalRef = 'user_demo_alice';
const fallbackPspSandboxBaseUrl = 'http://localhost:3002';

interface AppRuntimeEnv {
  VITE_API_BASE_URL?: string;
  VITE_CUSTOMER_EXTERNAL_REF?: string;
  VITE_PSP_SANDBOX_BASE_URL?: string;
}

function getNodeEnv(): AppRuntimeEnv | undefined {
  const runtime = globalThis as typeof globalThis & {
    process?: {
      env?: AppRuntimeEnv;
    };
  };

  return runtime.process?.env;
}

function getImportMetaEnv(): AppRuntimeEnv | undefined {
  const meta = import.meta as ImportMeta & {
    env?: AppRuntimeEnv;
  };

  return meta.env;
}

export function getApiBaseUrl(): string {
  return (
    getImportMetaEnv()?.VITE_API_BASE_URL ?? getNodeEnv()?.VITE_API_BASE_URL ?? fallbackApiBaseUrl
  );
}

export function getCustomerExternalRef(): string {
  return (
    getImportMetaEnv()?.VITE_CUSTOMER_EXTERNAL_REF ??
    getNodeEnv()?.VITE_CUSTOMER_EXTERNAL_REF ??
    fallbackCustomerExternalRef
  );
}

export function getPspSandboxBaseUrl(): string {
  return (
    getImportMetaEnv()?.VITE_PSP_SANDBOX_BASE_URL ??
    getNodeEnv()?.VITE_PSP_SANDBOX_BASE_URL ??
    fallbackPspSandboxBaseUrl
  );
}
