import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { users } from '../../db/users';
import { appServer } from '../constants/Constants';

export interface SalesforceAuthState {
  accessToken: string | null;
  orgUrl: string | null;
  instanceUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for managing Salesforce authentication using JWT bearer flow
 * Gets JWT from server, exchanges it for access token, and manages refresh
 */
export function useSalesforceAuth() {
  const { userId } = useParams<{ userId: string }>();
  const user = users.find(u => u.username === userId);

  const [authState, setAuthState] = useState<SalesforceAuthState>({
    accessToken: null,
    orgUrl: null,
    instanceUrl: null,
    isLoading: false,
    error: null,
  });

  const authenticate = useCallback(async () => {
    if (!user) {
      setAuthState(prev => ({
        ...prev,
        error: 'User not found',
        isLoading: false,
      }));
      return;
    }

    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Step 1: Get Salesforce JWT from server
      const jwtResponse = await fetch(`${appServer}/getSalesforceJwt?username=${user.username}`);
      if (!jwtResponse.ok) {
        const errorData = await jwtResponse.json();
        throw new Error(errorData.error || 'Failed to get Salesforce JWT');
      }

      const jwtData = await jwtResponse.json();
      const jwt = jwtData.jwt;

      if (!jwt) {
        throw new Error('No JWT token received from server');
      }

      // Step 2: Exchange JWT for access token
      const tokenResponse = await fetch(`${appServer}/exchangeSalesforceToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jwt }),
      });

      if (!tokenResponse.ok) {
        let errorMessage = 'Failed to exchange Salesforce token';
        try {
          const errorData = await tokenResponse.json();
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch (parseError) {
          // If response is not JSON, try to get text
          try {
            const errorText = await tokenResponse.text();
            errorMessage = errorText || errorMessage;
          } catch (textError) {
            errorMessage = `HTTP ${tokenResponse.status}: ${tokenResponse.statusText}`;
          }
        }
        console.error('Token exchange failed:', errorMessage);
        throw new Error(errorMessage);
      }

      const tokenData = await tokenResponse.json();

      setAuthState({
        accessToken: tokenData.accessToken,
        orgUrl: tokenData.orgUrl || tokenData.instanceUrl,
        instanceUrl: tokenData.instanceUrl || tokenData.orgUrl,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Salesforce authentication error:', error);
      setAuthState({
        accessToken: null,
        orgUrl: null,
        instanceUrl: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      });
    }
  }, [user]);

  // Authenticate on mount
  useEffect(() => {
    if (user && !authState.accessToken && !authState.isLoading) {
      authenticate();
    }
  }, [user, authenticate, authState.accessToken, authState.isLoading]);

  return {
    ...authState,
    authenticate,
    refresh: authenticate,
  };
}
