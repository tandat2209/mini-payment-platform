import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { JSDOM } from 'jsdom';
import { createRoot } from 'react-dom/client';

import { router } from '../src/app/router';
import { queryClient } from '../src/lib/query-client';

async function waitForStatus(container: HTMLDivElement): Promise<string> {
  const timeoutAt = Date.now() + 10_000;

  while (Date.now() < timeoutAt) {
    const text = container.textContent;

    if (
      text.includes('Total balance') &&
      text.includes('Add money') &&
      text.includes('Recent transactions')
    ) {
      return text;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(
    `Timed out waiting for the web app to render API health.\n\n${container.textContent}`,
  );
}

async function main(): Promise<void> {
  process.env.VITE_API_BASE_URL = process.env.VITE_API_BASE_URL ?? 'http://localhost:3001';
  process.env.VITE_CUSTOMER_EXTERNAL_REF =
    process.env.VITE_CUSTOMER_EXTERNAL_REF ?? 'user_demo_alice';

  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: 'http://localhost:5173',
  });

  globalThis.window = dom.window as unknown as typeof globalThis.window;
  globalThis.document = dom.window.document;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.HTMLDivElement = dom.window.HTMLDivElement;
  globalThis.Node = dom.window.Node;
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: dom.window.navigator,
  });
  globalThis.requestAnimationFrame = (callback: FrameRequestCallback) => {
    return setTimeout(() => callback(Date.now()), 16) as unknown as number;
  };
  globalThis.cancelAnimationFrame = (handle: number) => {
    clearTimeout(handle);
  };

  const container = document.getElementById('root');

  if (!(container instanceof dom.window.HTMLDivElement)) {
    throw new Error('Root container is missing');
  }

  const root = createRoot(container);
  root.render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  const renderedText = await waitForStatus(container);

  console.log('Web connectivity verification succeeded.');
  console.log(renderedText);

  queryClient.clear();
  root.unmount();
}

void main();
