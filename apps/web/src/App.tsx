import { useEffect, useState } from 'react';

import { fetchHealth, getApiBaseUrl, type HealthResponse } from './api';

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadHealth() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchHealth();
      setHealth(response);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Unknown error';
      setError(message);
      setHealth(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadHealth();
  }, []);

  return (
    <main className="app-shell">
      <section className="status-card">
        <p className="eyebrow">Current milestone</p>
        <h1>Project setup and API connectivity</h1>
        <p className="summary">
          The first milestone keeps the scope intentionally small: bring up the API, the web app,
          and the simulator, then prove the web app can reach the API.
        </p>

        <dl className="status-grid">
          <div>
            <dt>API endpoint</dt>
            <dd>{getApiBaseUrl()}/health</dd>
          </div>
          <div>
            <dt>Connection status</dt>
            <dd data-testid="connection-status">
              {isLoading ? 'Loading...' : health?.status ?? 'Unavailable'}
            </dd>
          </div>
          <div>
            <dt>Service</dt>
            <dd>{health?.service ?? 'api'}</dd>
          </div>
          <div>
            <dt>Timestamp</dt>
            <dd>{health?.timestamp ?? 'Waiting for response'}</dd>
          </div>
        </dl>

        {error ? <p className="error-text">Unable to reach the API: {error}</p> : null}

        <button className="refresh-button" onClick={() => void loadHealth()} type="button">
          Refresh health
        </button>
      </section>
    </main>
  );
}

export default App;

