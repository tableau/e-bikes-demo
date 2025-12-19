import { useEffect, useRef, useState } from 'react';
import { initializeAnalyticsSdk, AnalyticsAgent, AgentContextType } from '@salesforce/analytics-embedding-sdk';
import { useSalesforceAuth } from '../../hooks/useSalesforceAuth';
import { salesforceLightningOutAppId } from '../../constants/Constants';
import styles from './SalesforceAnalyticsAgent.module.css';

interface SalesforceAnalyticsAgentProps {
  containerId?: string;
  agentId?: string;
  contextType?: AgentContextType;
  contextTypeIdOrApiName?: string;
  showHeader?: boolean;
  showHeaderActions?: boolean;
}

/**
 * Generates a frontdoor URL using Salesforce's Lightning Out single access endpoint
 * @param accessToken The Salesforce access token
 * @param instanceUrl The Salesforce instance URL
 * @param loAppId The Lightning Out app ID
 * @returns Object with frontdoorUrl or error
 */
const getFrontdoorUrl = async (accessToken: string, instanceUrl: string, loAppId: string): Promise<{ frontdoorUrl?: string; error?: string; statusCode?: number }> => {
  try {
    if (!loAppId || loAppId.trim() === '') {
      return { error: 'Lightning Out app ID is required' };
    }

    const formData = new FormData();
    formData.append('access_token', accessToken);
    
    const lightningOutEndpoint = `${instanceUrl}/services/oauth2/lightningoutsingleaccess?lightning_out_app_id=${loAppId}`;
    
    const response = await fetch(lightningOutEndpoint, {
      method: 'POST',
      body: formData
    });
    
    console.log('response: ', response);
    
    if (!response.ok) {
      return { error: `HTTP error! status: ${response.status}`, statusCode: response.status };
    }
    
    const responseData = await response.json();
    console.log('Success: ', responseData);
    
    return { frontdoorUrl: responseData.frontdoor_uri || responseData.url || responseData };
  } catch (error) {
    console.error('Error in getLightningOutFrontdoorUrl:', error);
    return { error: error instanceof Error ? error.message : 'Failed to generate Lightning Out frontdoor URL' };
  }
};

/**
 * Component that embeds Salesforce Analytics Agent using the Analytics Embedding SDK
 * Uses JWT bearer flow for authentication
 */
export default function SalesforceAnalyticsAgent({
  containerId = 'salesforce-analytics-agent-container',
  agentId,
  contextType = AgentContextType.SDM,
  contextTypeIdOrApiName,
  showHeader = false,
  showHeaderActions = false,
}: SalesforceAnalyticsAgentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const agentElementRef = useRef<AnalyticsAgent | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const { accessToken, orgUrl, instanceUrl, isLoading, error: authError } = useSalesforceAuth();

  useEffect(() => {
    // Wait for authentication to complete
    if (isLoading || !accessToken || !orgUrl || !instanceUrl) {
      return;
    }

    // Initialize SDK and embed Analytics Agent
    const initializeAgent = async () => {
      if (!containerRef.current) {
        return;
      }

      setIsInitializing(true);
      setInitError(null);

      try {
        // Check if Lightning Out app ID is configured
        if (!salesforceLightningOutAppId || salesforceLightningOutAppId.trim() === '') {
          throw new Error('Lightning Out app ID not configured. Please set VITE_SALESFORCE_LIGHTNING_OUT_APP_ID in your .env file.');
        }

        // Generate frontdoor URL using Salesforce Lightning Out API
        const frontdoorResult = await getFrontdoorUrl(accessToken, instanceUrl, salesforceLightningOutAppId);
        
        if (frontdoorResult.error || !frontdoorResult.frontdoorUrl) {
          throw new Error(frontdoorResult.error || 'Failed to generate Lightning Out frontdoor URL');
        }

        const authCredential = frontdoorResult.frontdoorUrl;

        // Initialize the Analytics SDK
        console.log('Initializing Analytics SDK with:', {
          orgUrl,
          authCredentialLength: authCredential.length,
        });
        
        const initResponse = await initializeAnalyticsSdk({
          authCredential,
          orgUrl
        });

        console.log('SDK initialization response:', initResponse);
        console.log('SDK status value:', initResponse.status);
        console.log('SDK status type:', typeof initResponse.status);

        // Check if initialization was successful
        // The SDK returns a status that we need to verify
        // Handle both enum and string status values, case-insensitive
        // If status exists, check if it indicates success
        if (initResponse.status !== undefined && initResponse.status !== null) {
          const statusStr = String(initResponse.status).toUpperCase();
          const isSuccess = statusStr === 'SUCCESS' || statusStr === 'SUCCESSFUL';
          
          if (!isSuccess) {
            console.error('SDK initialization failed. Status:', initResponse.status);
            console.error('Full response:', initResponse);
            throw new Error(`SDK initialization failed: ${String(initResponse.status)}`);
          }
          
          console.log('SDK initialization successful. Status:', initResponse.status);
        } else {
          // If no status is returned, assume success (some SDK versions may not return status)
          console.log('SDK initialization completed (no status returned, assuming success)');
        }

        // After SDK initialization, embed the Analytics Agent
        if (containerRef.current && agentId) {
          // Clean up previous agent instance if it exists
          if (agentElementRef.current) {
            try {
              // Dispose of previous agent if SDK provides cleanup method
              if (typeof (agentElementRef.current as any).dispose === 'function') {
                (agentElementRef.current as any).dispose();
              }
            } catch (cleanupError) {
              console.warn('Error cleaning up previous agent:', cleanupError);
            }
            agentElementRef.current = null;
          }

          // Don't manually clear the container - let React and SDK manage it
          // The SDK will handle DOM manipulation, and React will reconcile naturally
          const container = containerRef.current;

          // Create AnalyticsAgent web component instance
          const agentElement = new AnalyticsAgent({
            idOrApiName: agentId, // Required: Agent ID or API name
            parentIdOrElement: container,
            contextType: contextType, // Required: Type of asset (SDM, METRIC, or DASHBOARD)
            contextTypeIdOrApiName: contextTypeIdOrApiName || '', // Required: ID or API name of the asset
            showHeader: showHeader,
            showHeaderActions: showHeaderActions,
          });

          // Store reference for cleanup
          agentElementRef.current = agentElement;

          // Render the agent component
          await agentElement.render();
        } else if (!agentId) {
          throw new Error('Agent ID is required to embed Analytics Agent');
        }
      } catch (error) {
        console.error('Error initializing Salesforce Analytics Agent:', error);
        setInitError(error instanceof Error ? error.message : 'Failed to initialize Analytics Agent');
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAgent();

    // Cleanup function to properly dispose of agent on unmount or dependency change
    return () => {
      if (agentElementRef.current) {
        try {
          // Dispose of agent if SDK provides cleanup method
          if (typeof (agentElementRef.current as any).dispose === 'function') {
            (agentElementRef.current as any).dispose();
          }
        } catch (cleanupError) {
          console.warn('Error cleaning up agent on unmount:', cleanupError);
        }
        agentElementRef.current = null;
      }
      
      // Don't manually clear the container - let React handle DOM cleanup
      // Manually removing nodes conflicts with React's reconciliation
    };
  }, [accessToken, orgUrl, instanceUrl, isLoading, agentId, contextType, contextTypeIdOrApiName, showHeader, showHeaderActions]);

  // Use separate containers: one for React-managed content, one for SDK-managed content
  // This prevents React from trying to manage nodes that the SDK manipulates
  const showReactContent = isLoading || isInitializing || !!authError || !!initError;
  
  return (
    <div className={styles.container} id={containerId} style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* SDK container - always rendered and visible so ref is available */}
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Agent will be embedded here by the SDK */}
      </div>
      
      {/* React-managed content - shown as overlay when needed */}
      {showReactContent && (
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0,
          zIndex: 10,
          backgroundColor: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {isLoading || isInitializing ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Initializing Salesforce Analytics Agent...</p>
            </div>
          ) : authError ? (
            <div className={styles.errorState}>
              <p className={styles.errorTitle}>Authentication Error</p>
              <p className={styles.errorMessage}>{authError}</p>
              <button 
                className={styles.retryButton}
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          ) : initError ? (
            <div className={styles.errorState}>
              <p className={styles.errorTitle}>Initialization Error</p>
              <p className={styles.errorMessage}>{initError}</p>
              <button 
                className={styles.retryButton}
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

