import { useEffect, useRef, useState } from 'react';
import type { AnalyticsDashboard } from '@salesforce/analytics-embedding-sdk';
import { appServer } from '../../constants/Constants';
import styles from './Analytics.module.css';

const DASHBOARD_ID_OR_API_NAME = 'New_Dashboard1';
const AGENT_ID = import.meta.env.VITE_SALESFORCE_ANALYTICS_AGENT_ID ?? '';

type AnalyticsSdk = typeof import('@salesforce/analytics-embedding-sdk');

/**
 * Matches Tabnext SalesCloud.js: skip initializeAnalyticsSdk when credentials are unchanged
 * (same as server session cache returning the same frontdoor + org URL).
 */
let lastInitializeAuthKey: string | null = null;

/** Coalesces concurrent initializeAnalyticsSdk calls (e.g. React StrictMode double mount). */
const initInflightByKey = new Map<string, Promise<void>>();

function authKey(data: { frontdoorUrl: string; orgUrl: string }): string {
  return `${data.frontdoorUrl}\u0000${data.orgUrl}`;
}

function initializeAnalyticsSdkSafe(
  initializeAnalyticsSdk: AnalyticsSdk['initializeAnalyticsSdk'],
  config: { authCredential: string; orgUrl: string },
) {
  return initializeAnalyticsSdk(config).catch((initErr: unknown) => {
    const msg = initErr instanceof Error ? initErr.message : String(initErr);
    if (msg.includes('already been used') || msg.includes('already defined')) {
      return Promise.resolve();
    }
    throw initErr;
  });
}

/** SalesCloud-style: one init per credential key; coalesce parallel callers (e.g. StrictMode). */
async function ensureAnalyticsSdkInitialized(
  initializeAnalyticsSdk: AnalyticsSdk['initializeAnalyticsSdk'],
  data: { frontdoorUrl: string; orgUrl: string },
): Promise<void> {
  const key = authKey(data);
  if (lastInitializeAuthKey === key) {
    return;
  }

  let p = initInflightByKey.get(key);
  if (!p) {
    p = initializeAnalyticsSdkSafe(initializeAnalyticsSdk, {
      authCredential: data.frontdoorUrl,
      orgUrl: data.orgUrl,
    })
      .then(() => {
        lastInitializeAuthKey = key;
      })
      .finally(() => {
        initInflightByKey.delete(key);
      });
    initInflightByKey.set(key, p);
  }
  await p;
}

function Analytics() {
  const containerRef = useRef<HTMLDivElement>(null);
  const agentContainerRef = useRef<HTMLDivElement>(null);
  const sdkModuleRef = useRef<AnalyticsSdk | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  /** Tabnext ChatAgent.js: FAB toggles fixed chat overlay (not inline aside). */
  const [agentOpen, setAgentOpen] = useState(false);
  const [auth, setAuth] = useState<{ frontdoorUrl: string; orgUrl: string } | null>(null);
  const dashboardRef = useRef<AnalyticsDashboard | null>(null);
  const agentRef = useRef<InstanceType<AnalyticsSdk['AnalyticsAgent']> | null>(null);

  const loadDashboard = async (lifecycle?: { cancelled: boolean }) => {
    const cancelled = () => lifecycle?.cancelled === true;
    setStatus('loading');
    setErrorMessage('');
    try {
      const base = appServer || '';
      const devLog = import.meta.env.DEV
        ? (phase: string, start: number) =>
            console.debug(`[Analytics] ${phase}: ${Math.round(performance.now() - start)}ms`)
        : () => {};
      let mark = typeof performance !== 'undefined' ? performance.now() : 0;

      const authPromise = (async () => {
        const res = await fetch(`${base}/salesforce-auth`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data as { message?: string }).message || `Auth failed: ${res.status}`);
        }
        return res.json() as Promise<{ frontdoorUrl: string; orgUrl: string }>;
      })();

      const sdkPromise = import('@salesforce/analytics-embedding-sdk').then((mod) => {
        sdkModuleRef.current = mod;
        return mod;
      });

      const [data, sdk] = await Promise.all([authPromise, sdkPromise]);
      if (cancelled()) return;

      devLog('Promise.all(auth + sdk import)', mark);
      mark = performance.now();

      const { initializeAnalyticsSdk, AnalyticsDashboard: AnalyticsDashboardClass } = sdk;

      setAuth(data);

      await ensureAnalyticsSdkInitialized(initializeAnalyticsSdk, data);
      if (cancelled()) return;

      devLog('initializeAnalyticsSdk (skipped if same auth)', mark);
      mark = performance.now();

      if (!containerRef.current) {
        throw new Error('Dashboard container not found');
      }

      const dashboard = new AnalyticsDashboardClass({
        parentIdOrElement: containerRef.current,
        idOrApiName: DASHBOARD_ID_OR_API_NAME,
      });
      dashboardRef.current = dashboard;

      // Tabnext SalesCloud.js: start render without awaiting so the shell can paint while the iframe loads.
      setStatus('ready');
      void dashboard
        .render()
        .then(() => {
          if (cancelled()) return;
          devLog('dashboard.render()', mark);
        })
        .catch((renderErr: unknown) => {
          if (cancelled()) return;
          const msg = renderErr instanceof Error ? renderErr.message : 'Failed to load analytics';
          setErrorMessage(msg);
          setStatus('error');
        });
    } catch (err) {
      if (cancelled()) return;
      const msg = err instanceof Error ? err.message : 'Failed to load analytics';
      setErrorMessage(msg);
      setStatus('error');
    }
  };

  useEffect(() => {
    const lifecycle = { cancelled: false };
    void loadDashboard(lifecycle);
    return () => {
      lifecycle.cancelled = true;
      dashboardRef.current = null;
      agentRef.current = null;
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  useEffect(() => {
    if (!agentOpen || !auth || !AGENT_ID || !agentContainerRef.current) return;
    const sdk = sdkModuleRef.current;
    if (!sdk) return;

    const host = agentContainerRef.current;
    host.innerHTML = '';

    let mounted = true;
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          if (!mounted || !agentContainerRef.current) return;
          const { initializeAnalyticsSdk, AnalyticsAgent, AgentContextType } = sdk;
          await ensureAnalyticsSdkInitialized(initializeAnalyticsSdk, auth);
          if (!mounted || !agentContainerRef.current) return;
          // Tabnext ChatAgent.js: DASHBOARD context + embedded dashboard id (Sales_Cloud_Dashboard pattern).
          const agent = new AnalyticsAgent({
            parentIdOrElement: agentContainerRef.current,
            idOrApiName: AGENT_ID,
            contextType: AgentContextType.DASHBOARD,
            contextTypeIdOrApiName: DASHBOARD_ID_OR_API_NAME,
          });
          agentRef.current = agent;
          await agent.render();
        } catch {
          agentRef.current = null;
        }
      })();
    }, 50);

    return () => {
      mounted = false;
      window.clearTimeout(t);
      agentRef.current = null;
      host.innerHTML = '';
    };
  }, [agentOpen, auth]);

  const toggleAgentChat = () => {
    setAgentOpen((open) => !open);
  };

  const handleCloseAgent = () => {
    setAgentOpen(false);
    agentRef.current = null;
  };

  return (
    <div className={styles.root} role="region" aria-label="Analytics">
      <div className={styles.dashboardPage}>
        {status !== 'error' && (
          <header className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Analytics</h1>
          </header>
        )}

        <div className={styles.embeddingRow}>
          <div
            ref={containerRef}
            className={styles.dashboardEmbeddingContainer}
            aria-label="Ebike Sales dashboard"
          />
        </div>
      </div>

      {status === 'ready' && AGENT_ID && (
        <>
          <button
            type="button"
            className={styles.chatButton}
            onClick={toggleAgentChat}
            title="Chat with Analytics Agent"
            aria-expanded={agentOpen}
            aria-controls="analytics-agent-chat"
          >
            <span className={styles.chatButtonIcon} aria-hidden>
              💬
            </span>
            <span className={styles.chatPulse} aria-hidden />
          </button>

          <div
            id="analytics-agent-chat"
            className={`${styles.chatOverlay} ${agentOpen ? styles.chatOverlayOpen : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label="Analytics Agent"
            aria-hidden={!agentOpen}
          >
            <header className={styles.chatHeader}>
              <h3 className={styles.chatHeaderTitle}>Analytics Agent</h3>
              <button
                type="button"
                className={styles.chatCloseBtn}
                onClick={handleCloseAgent}
                title="Close"
                aria-label="Close Analytics Agent"
              >
                ×
              </button>
            </header>
            <div ref={agentContainerRef} className={styles.chatBody} />
          </div>
        </>
      )}

      {status === 'ready' && !AGENT_ID && (
        <p className={styles.agentConfigHint}>
          Set <code>VITE_SALESFORCE_ANALYTICS_AGENT_ID</code> to enable the floating Analytics Agent chat.
        </p>
      )}

      {status === 'loading' && (
        <div className={styles.loadingOverlay} aria-live="polite">Loading dashboard…</div>
      )}
      {status === 'error' && (
        <div className={styles.error}>
          <p>{errorMessage}</p>
          <button type="button" className={styles.retryButton} onClick={() => void loadDashboard()}>
            Retry
          </button>
        </div>
      )}
    </div>
  );
}

export default Analytics;
