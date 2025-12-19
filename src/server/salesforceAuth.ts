import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { Err, Ok, Result } from 'ts-results';
import { salesforceOrgUrl } from './Constants';

export interface SalesforceTokenResponse {
  access_token: string;
  instance_url: string;
  id: string;
  token_type: string;
  issued_at: string;
  signature: string;
}

export interface TokenExchangeRequest {
  jwt: string;
}

/**
 * Exchanges a Salesforce JWT token for an access token
 * @param jwt The JWT assertion token
 * @returns Result containing access token and instance URL, or error
 */
export async function exchangeSalesforceJwt(jwt: string): Promise<Result<SalesforceTokenResponse, string>> {
  try {
    // Read from process.env directly (with fallback to Constants) to ensure dotenv has loaded
    const orgUrl = process.env.VITE_SALESFORCE_ORG_URL || salesforceOrgUrl || '';
    
    if (!orgUrl || orgUrl.trim() === '') {
      return new Err('Salesforce org URL not configured. Please set VITE_SALESFORCE_ORG_URL in your .env file.');
    }

    // Extract domain from org URL
    const orgDomain = orgUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const tokenEndpoint = `https://${orgDomain}/services/oauth2/token`;

    console.log('Exchanging JWT at endpoint:', tokenEndpoint);
    console.log('JWT length:', jwt.length);
    console.log('JWT preview:', jwt.substring(0, 50) + '...');

    // Prepare the request body for JWT bearer flow
    const body = new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    });

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const raw = await response.text();
    console.log('Salesforce response status:', response.status);
    console.log('Salesforce response body:', raw);

    if (!response.ok) {
      return new Err(`Salesforce token exchange failed: ${response.status} ${raw}`);
    }

    try {
      const tokenData = JSON.parse(raw) as SalesforceTokenResponse;
      
      if (!tokenData.access_token) {
        return new Err('No access token in response');
      }

      return new Ok(tokenData);
    } catch (parseError) {
      return new Err(`Failed to parse Salesforce response: ${raw}`);
    }
  } catch (error) {
    return new Err(`Salesforce token exchange error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Express handler for exchanging Salesforce JWT token
 */
export async function exchangeSalesforceToken(request: ExpressRequest, response: ExpressResponse) {
  try {
    console.log('Exchange token request body:', JSON.stringify(request.body));
    const { jwt } = request.body as TokenExchangeRequest;

    if (!jwt) {
      console.error('JWT token missing in request body');
      response.status(400).send({ error: 'JWT token is required' });
      return;
    }

    console.log('Exchanging JWT token (length:', jwt.length, ')');
    const exchangeResult = await exchangeSalesforceJwt(jwt);

    if (exchangeResult.err) {
      console.error('Salesforce token exchange error:', exchangeResult.val);
      response.status(400).send({ error: exchangeResult.val });
      return;
    }

    const tokenData = exchangeResult.val;
    
    // Read orgUrl from process.env directly (with fallback to Constants) to ensure dotenv has loaded
    const orgUrl = process.env.VITE_SALESFORCE_ORG_URL || salesforceOrgUrl || tokenData.instance_url;
    
    response.send({
      accessToken: tokenData.access_token,
      instanceUrl: tokenData.instance_url,
      orgUrl: orgUrl,
      tokenType: tokenData.token_type,
    });
  } catch (error) {
    console.error('Error exchanging Salesforce token:', error);
    response.status(500).send({ 
      error: 'Failed to exchange token', 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
}
