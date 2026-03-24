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

function buildRequestConfig(options?: RequestOptions): AxiosRequestConfig {
  return options?.includeCustomerContext === false
    ? {}
    : {
        headers: { 'x-customer-external-ref': getCustomerExternalRef() },
      };
}

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
    const response = await apiClient.get<T, { data: T }>(path, buildRequestConfig(options));

    return response.data;
  } catch (caughtError) {
    throw new Error(getRequestErrorMessage(caughtError, options?.errorLabel ?? 'Request'));
  }
}

export async function postJson<TResponse, TBody>(
  path: string,
  body: TBody,
  options?: RequestOptions,
): Promise<TResponse> {
  try {
    const response = await apiClient.post<TResponse, { data: TResponse }>(
      path,
      body,
      buildRequestConfig(options),
    );

    return response.data;
  } catch (caughtError) {
    throw new Error(getRequestErrorMessage(caughtError, options?.errorLabel ?? 'Request'));
  }
}

export async function postJsonToBase<TResponse, TBody>(
  baseUrl: string,
  path: string,
  body: TBody,
  options?: RequestOptions,
): Promise<TResponse> {
  try {
    const response = await axios.post<TResponse, { data: TResponse }>(path, body, {
      ...buildRequestConfig(options),
      baseURL: baseUrl,
    });

    return response.data;
  } catch (caughtError) {
    throw new Error(getRequestErrorMessage(caughtError, options?.errorLabel ?? 'Request'));
  }
}
