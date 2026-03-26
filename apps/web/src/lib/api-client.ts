import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import axios from 'axios';

import { getApiBaseUrl, getCustomerExternalRef } from './runtime-env';

type RequestOptions = {
  errorLabel?: string;
  headers?: Record<string, string>;
  includeCustomerContext?: boolean;
};

const apiClient: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
});

function buildRequestConfig(options?: RequestOptions): AxiosRequestConfig {
  const headers =
    options?.includeCustomerContext === false
      ? { ...(options?.headers ?? {}) }
      : {
          'x-customer-external-ref': getCustomerExternalRef(),
          ...(options?.headers ?? {}),
        };

  return Object.keys(headers).length > 0 ? { headers } : {};
}

function getRequestErrorMessage(caughtError: unknown, fallbackLabel: string): string {
  if (axios.isAxiosError(caughtError)) {
    const status = caughtError.response?.status;
    const errorMessage = extractApiErrorMessage(caughtError.response?.data);

    if (errorMessage) {
      return errorMessage;
    }

    if (typeof status === 'number') {
      return `${fallbackLabel} failed with status ${status}`;
    }

    if (typeof caughtError.message === 'string' && caughtError.message.length > 0) {
      return caughtError.message;
    }
  }

  return `${fallbackLabel} failed`;
}

function extractApiErrorMessage(data: unknown): string | null {
  if (typeof data !== 'object' || data === null) {
    return null;
  }

  const error = (data as { error?: unknown }).error;

  if (typeof error !== 'object' || error === null) {
    return null;
  }

  const message = (error as { message?: unknown }).message;

  return typeof message === 'string' && message.trim().length > 0 ? message : null;
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

export async function getJsonWithoutThrow<T>(path: string, options?: RequestOptions): Promise<T> {
  const response = await apiClient.get<T, { data: T }>(path, buildRequestConfig(options));

  return response.data;
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
