import { JSDOM } from 'jsdom';
import { createRoot } from 'react-dom/client';

import App from '../src/App';

async function waitForStatus(container: HTMLDivElement) {
  const timeoutAt = Date.now() + 10_000;

  while (Date.now() < timeoutAt) {
    const text = container.textContent ?? '';

    if (text.includes('Connection status') && text.includes('ok')) {
      return text;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`Timed out waiting for the web app to render API health.\n\n${container.textContent}`);
}

async function main() {
  process.env.VITE_API_BASE_URL = process.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

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
  globalThis.requestAnimationFrame = (callback: FrameRequestCallback) =>
    setTimeout(() => callback(Date.now()), 16) as unknown as number;
  globalThis.cancelAnimationFrame = (handle: number) => clearTimeout(handle);

  const container = document.getElementById('root');

  if (!(container instanceof dom.window.HTMLDivElement)) {
    throw new Error('Root container is missing');
  }

  const root = createRoot(container);
  root.render(<App />);

  const renderedText = await waitForStatus(container);

  console.log('Web connectivity verification succeeded.');
  console.log(renderedText);
}

void main();
