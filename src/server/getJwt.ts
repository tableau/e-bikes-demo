import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { Err, Ok, Result } from 'ts-results';
import Base64 from 'crypto-js/enc-base64';
import Utf8 from 'crypto-js/enc-utf8';
import hmacSHA256 from 'crypto-js/hmac-sha256';
import WordArray from 'crypto-js/lib-typedarrays';
import jwt from 'jsonwebtoken';
import { readFileSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { User, users } from '../db/users';
import { salesforceConsumerKey, salesforceOrgUrl, salesforcePrivateKey, salesforcePrivateKeyPath, salesforceUsername } from './Constants';

// Fallback: Read directly from process.env if Constants didn't load it (for edge cases)
const getSalesforcePrivateKeyPath = () => {
  return salesforcePrivateKeyPath || process.env.VITE_SALESFORCE_PRIVATE_KEY_PATH || '';
};

const getSalesforcePrivateKey = () => {
  return salesforcePrivateKey || process.env.VITE_SALESFORCE_PRIVATE_KEY || '';
};

export type RequestData = {
  tableauServer: string;
  site: string;
  apiVersion: string;
  apiPath: string;
  query: string;
  jwt: string;
}; 

export async function getJwt(request: ExpressRequest, response: ExpressResponse) {
  try {
    const requestResult = validateRequest(request);
    if (requestResult.err) {
      response.status(403).send({ error: 'invalid_request' });
      return;
    }

    const { username, license } = requestResult.val;
    const user = users.find(u => u.username === username);

    if (!user) {
      response.status(501).send({ error: 'invalid username' });
      return;
    }

    const jwt = createJwt(user, license);
    response.send({ jwt: jwt });

  } catch (e: unknown) {
    response.send({ error: `${e}` });
  }
}

function validateRequest(request: ExpressRequest): Result<{ username: string, license: string }, void> {

  const username = `${request.query.username || ''}`;
  const license = `${request.query.license || ''}`;
  if (!username) {
    return Err.EMPTY;
  }

  return new Ok({ username, license });
}

function base64url(source: WordArray) {
  // Encode in classical base64
  let encodedSource = Base64.stringify(source);

  // Remove padding equal characters
  encodedSource = encodedSource.replace(/=+$/, '');

  // Replace characters according to base64url specifications
  encodedSource = encodedSource.replace(/\+/g, '-');
  encodedSource = encodedSource.replace(/\//g, '_');

  return encodedSource;
}

export function createJwt(user: User, license: string) {

  const scopes = ["tableau:views:embed", "tableau:views:embed_authoring", "tableau:insights:embed", "tableau:insight_metrics:read", "tableau:insights:read"];

  const header = {
    alg: 'HS256',
    typ: 'JWT',
    kid: process.env.VITE_SECRET_ID,
    iss: process.env.VITE_CLIENT_ID,
  };

  const data = {
    jti: uuidv4(),
    iss: process.env.VITE_CLIENT_ID,
    aud: 'tableau',
    sub: process.env.VITE_USERNAME,
    scp: scopes,
    iat: Math.floor(Date.now() / 1000) - 5,
    exp: Math.floor(Date.now() / 1000) + 10 * 60,
    retailer: user.isRetailer ? user.company : null,
    license: license,
  };

  const encodedHeader = base64url(Utf8.parse(JSON.stringify(header)));
  const encodedData = base64url(Utf8.parse(JSON.stringify(data)));

  const token = `${encodedHeader}.${encodedData}`;
  const signature = base64url(hmacSHA256(token, process.env.VITE_SECRET_VALUE!));

  return `${token}.${signature}`;
}

export async function getSalesforceJwt(request: ExpressRequest, response: ExpressResponse) {
  try {
    const requestResult = validateRequest(request);
    if (requestResult.err) {
      response.status(403).send({ error: 'invalid_request' });
      return;
    }

    const { username } = requestResult.val;
    const user = users.find(u => u.username === username);

    if (!user) {
      response.status(501).send({ error: 'invalid username' });
      return;
    }

    console.log('Generating Salesforce JWT for user:', username);
    const jwtToken = createSalesforceJwt();
    console.log('JWT generated successfully (length:', jwtToken.length, ')');
    response.send({ jwt: jwtToken });

  } catch (e: unknown) {
    console.error('Error generating Salesforce JWT:', e);
    response.status(500).send({ error: `${e}` });
  }
}

/**
 * Loads the Salesforce private key from either a file path or environment variable
 * Supports both file path (VITE_SALESFORCE_PRIVATE_KEY_PATH) and direct key (VITE_SALESFORCE_PRIVATE_KEY)
 */
function loadSalesforcePrivateKey(): string {
  // Get values with fallback to process.env
  const keyPath = getSalesforcePrivateKeyPath();
  const directKey = getSalesforcePrivateKey();
  
  // Option 1: Load from file path (preferred)
  if (keyPath && keyPath.trim() !== '') {
    try {
      // Resolve path relative to project root
      const resolvedPath = keyPath.startsWith('/') 
        ? keyPath 
        : join(process.cwd(), keyPath);
      
      const privateKey = readFileSync(resolvedPath, 'utf8');
      
      // Validate it's a valid private key format
      if (!privateKey.includes('BEGIN PRIVATE KEY') && !privateKey.includes('BEGIN RSA PRIVATE KEY')) {
        throw new Error('File does not appear to contain a valid private key');
      }
      
      return privateKey.trim();
    } catch (error) {
      throw new Error(`Failed to read private key from file: ${keyPath}. Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Option 2: Load from environment variable (direct key)
  if (directKey && directKey.trim() !== '') {
    // Replace escaped newlines with actual newlines
    const privateKey = directKey.replace(/\\n/g, '\n');
    
    // Validate it's a valid private key format
    if (!privateKey.includes('BEGIN PRIVATE KEY') && !privateKey.includes('BEGIN RSA PRIVATE KEY')) {
      throw new Error('Private key does not appear to be in valid PEM format');
    }
    
    return privateKey;
  }
  
  throw new Error('Salesforce private key not configured. Set either VITE_SALESFORCE_PRIVATE_KEY_PATH (file path) or VITE_SALESFORCE_PRIVATE_KEY (direct key)');
}

export function createSalesforceJwt(): string {
  // Salesforce JWT requires RS256 algorithm with private key
  // The private key should be in PEM format
  
  // Read from process.env directly (with fallback to Constants) to ensure dotenv has loaded
  const consumerKey = process.env.VITE_SALESFORCE_CONSUMER_KEY || salesforceConsumerKey || '';
  const username = process.env.VITE_SALESFORCE_USERNAME || salesforceUsername || '';
  const orgUrl = process.env.VITE_SALESFORCE_ORG_URL || salesforceOrgUrl || '';
  
  // Check configuration with helpful error messages
  if (!consumerKey || consumerKey.trim() === '') {
    throw new Error('Salesforce consumer key not configured. Please set VITE_SALESFORCE_CONSUMER_KEY in your .env file.');
  }

  if (!username || username.trim() === '') {
    throw new Error('Salesforce username not configured. Please set VITE_SALESFORCE_USERNAME in your .env file.');
  }

  if (!orgUrl || orgUrl.trim() === '') {
    throw new Error('Salesforce org URL not configured. Please set VITE_SALESFORCE_ORG_URL in your .env file.');
  }

  const privateKey = loadSalesforcePrivateKey();

  // Extract domain from org URL for audience
  const orgDomain = orgUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const audience = `https://${orgDomain}`;

  // JWT payload for Salesforce
  const payload = {
    iss: consumerKey, // Consumer Key from Connected App
    sub: username, // Username to impersonate
    aud: audience, // Salesforce org URL
    exp: Math.floor(Date.now() / 1000) + 5 * 60, // 5 minutes expiration
    iat: Math.floor(Date.now() / 1000),
  };

  // Sign JWT with RS256 algorithm
  const token = jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    header: {
      alg: 'RS256',
      typ: 'JWT',
    },
  });

  return token;
}


