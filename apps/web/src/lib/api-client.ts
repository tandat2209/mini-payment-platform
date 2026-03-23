import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import axios from 'axios';

import { getApiBaseUrl, getCustomerExternalRef } from './runtime-env';

type RequestOptions = {
  errorLabel?: string;
  includeCustomerContext?: boolean;
};

const apiClient: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
});

function getRequestErrorMessage(caughtError: unknown, fallbackLabel: string): string {
  if (axios.isAxiosError(caughtError)) {
    const status = caughtError.response?.status;

    if (typeof status === 'number') {
      return `${fallbackLabel} failed with status ${status}`;
    }

    if (typeof caughtError.message === 'string' && caughtError.message.length > 0) {
      return caughtError.message;
    }
  }

  return `${fallbackLabel} failed`;
}

export async function getJson<T>(path: string, options?: RequestOptions): Promise<T> {
  try {
    const requestConfig: AxiosRequestConfig =
      options?.includeCustomerContext === false
        ? {}
        : {
            headers: { 'x-customer-external-ref': getCustomerExternalRef() },
          };

    const response = await apiClient.get<T, { data: T }>(path, requestConfig);

    return response.data;
  } catch (caughtError) {
    throw new Error(getRequestErrorMessage(caughtError, options?.errorLabel ?? 'Request'));
  }
}
