import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/** Cached PEM so we do not re-read the key file on every request. */
let cachedPrivateKeyPem: string | null = null;

function getPrivateKey(): string {
  if (cachedPrivateKeyPem) {
    return cachedPrivateKeyPem;
  }
  const keyPath = process.env.SALESFORCE_PRIVATE_KEY_PATH;
  if (keyPath) {
    const resolved = path.isAbsolute(keyPath) ? keyPath : path.resolve(process.cwd(), keyPath);
    cachedPrivateKeyPem = fs.readFileSync(resolved, 'utf8');
    return cachedPrivateKeyPem;
  }
  const pem = process.env.SALESFORCE_PRIVATE_KEY;
  if (!pem) {
    throw new Error('Missing SALESFORCE_PRIVATE_KEY or SALESFORCE_PRIVATE_KEY_PATH');
  }
  cachedPrivateKeyPem = pem.replace(/\\n/g, '\n');
  return cachedPrivateKeyPem;
}

function base64urlEncode(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function createSalesforceJwt(clientId: string, user: string, audience: string, privateKeyPem: string): string {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientId,
    sub: user,
    aud: audience,
    iat: now,
    exp: now + 120,
  };

  const headerB64 = base64urlEncode(JSON.stringify(header));
  const payloadB64 = base64urlEncode(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = crypto.createPrivateKey({
    key: privateKeyPem,
    format: 'pem',
  });
  const signature = crypto.createSign('RSA-SHA256').update(signingInput).sign(key);
  const signatureB64 = base64urlEncode(signature);

  return `${signingInput}.${signatureB64}`;
}

/** Reuse access token until Salesforce expiry (minus skew) to skip repeated OAuth HTTP calls. */
type TokenCacheEntry = {
  access_token: string;
  instance_url: string;
  expiresAtMs: number;
};
let tokenCache: TokenCacheEntry | null = null;

const TOKEN_REFRESH_SKEW_MS = 120_000;

async function getAccessToken(): Promise<{ access_token: string; instance_url: string; expires_in: number }> {
  const now = Date.now();
  if (tokenCache && now < tokenCache.expiresAtMs - TOKEN_REFRESH_SKEW_MS) {
    const expires_in = Math.max(60, Math.floor((tokenCache.expiresAtMs - now) / 1000));
    return {
      access_token: tokenCache.access_token,
      instance_url: tokenCache.instance_url,
      expires_in,
    };
  }

  const clientId = process.env.SALESFORCE_CLIENT_ID;
  const loginUrl = process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com';
  const user = process.env.SALESFORCE_USER;

  if (!clientId || !user) {
    throw new Error('Missing SALESFORCE_CLIENT_ID or SALESFORCE_USER');
  }

  const privateKeyPem = getPrivateKey();
  const aud =
    loginUrl === 'https://test.salesforce.com' ? 'https://test.salesforce.com' : 'https://login.salesforce.com';
  const jwt = createSalesforceJwt(clientId, user, aud, privateKeyPem);

  const tokenUrl = `${loginUrl}/services/oauth2/token`;
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: jwt,
  });

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    tokenCache = null;
    const text = await res.text();
    throw new Error(`Salesforce token request failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    instance_url: string;
    expires_in?: number;
  };
  const expires_in = typeof data.expires_in === 'number' ? data.expires_in : 7200;
  tokenCache = {
    access_token: data.access_token,
    instance_url: data.instance_url,
    expiresAtMs: now + expires_in * 1000,
  };
  return { access_token: data.access_token, instance_url: data.instance_url, expires_in };
}

async function getFrontdoorUrl(accessToken: string, instanceUrl: string): Promise<string> {
  const frontdoorEndpoint = `${instanceUrl}/services/oauth2/singleaccess`;
  const myHeaders = new Headers();
  myHeaders.append('accept', 'application/json');
  myHeaders.append('authorization', `Bearer ${accessToken}`);
  myHeaders.append('content-type', 'application/x-www-form-urlencoded');
  const urlencoded = new URLSearchParams();

  const response = await fetch(frontdoorEndpoint, {
    method: 'POST',
    headers: myHeaders,
    body: urlencoded,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Salesforce singleaccess failed: ${response.status} ${text}`);
  }

  const responseData = (await response.json()) as { frontdoor_uri?: string };
  if (!responseData.frontdoor_uri) {
    throw new Error('No frontdoor_uri in singleaccess response');
  }
  return responseData.frontdoor_uri;
}

function instanceUrlToOrgUrl(instanceUrl: string): string {
  try {
    const u = new URL(instanceUrl);
    const host = u.hostname;
    if (host.endsWith('.my.salesforce.com')) {
      const subdomain = host.slice(0, -'.my.salesforce.com'.length);
      return `https://${subdomain}.lightning.force.com`;
    }
    if (host.endsWith('.salesforce.com')) {
      const subdomain = host.slice(0, -'.salesforce.com'.length);
      return `https://${subdomain}.lightning.force.com`;
    }
    return instanceUrl;
  } catch {
    return instanceUrl;
  }
}

/** Reuse frontdoor + orgUrl for a short window to avoid an extra singleaccess round trip per navigation. */
type SessionCacheEntry = {
  frontdoorUrl: string;
  orgUrl: string;
  validUntilMs: number;
};
let sessionCache: SessionCacheEntry | null = null;

function parseSessionCacheSeconds(): number {
  const raw = process.env.SALESFORCE_AUTH_SESSION_CACHE_SECONDS;
  if (raw === undefined || raw === '') {
    return 300;
  }
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : 300;
}

export async function salesforceAuth(_request: ExpressRequest, response: ExpressResponse) {
  const debug = process.env.SALESFORCE_AUTH_DEBUG === '1' || process.env.SALESFORCE_AUTH_DEBUG === 'true';
  const t0 = debug ? Date.now() : 0;

  try {
    const sessionTtlSec = parseSessionCacheSeconds();
    const now = Date.now();
    if (sessionTtlSec > 0 && sessionCache && now < sessionCache.validUntilMs) {
      if (debug) {
        console.log(`[salesforce-auth] session cache hit (${Date.now() - t0}ms)`);
      }
      response.json({ frontdoorUrl: sessionCache.frontdoorUrl, orgUrl: sessionCache.orgUrl });
      return;
    }

    const tAfterCache = debug ? Date.now() : 0;
    const { access_token, instance_url, expires_in } = await getAccessToken();
    if (debug) {
      console.log(`[salesforce-auth] access token (${Date.now() - tAfterCache}ms)`);
    }

    const tFd = debug ? Date.now() : 0;
    const frontdoorUrl = await getFrontdoorUrl(access_token, instance_url);
    if (debug) {
      console.log(`[salesforce-auth] singleaccess (${Date.now() - tFd}ms)`);
    }

    const orgUrl = instanceUrlToOrgUrl(instance_url);

    if (sessionTtlSec > 0) {
      const capMs = sessionTtlSec * 1000;
      const tokenBasedMs = expires_in * 1000 - TOKEN_REFRESH_SKEW_MS;
      const ttlMs = Math.min(capMs, tokenBasedMs, 60 * 60 * 1000);
      const issuedAt = Date.now();
      sessionCache = {
        frontdoorUrl,
        orgUrl,
        validUntilMs: issuedAt + Math.max(ttlMs, 30_000),
      };
    }

    if (debug) {
      console.log(`[salesforce-auth] total ${Date.now() - t0}ms`);
    }

    response.json({ frontdoorUrl, orgUrl });
  } catch (error) {
    sessionCache = null;
    tokenCache = null;
    const message = error instanceof Error ? error.message : String(error);
    console.error('salesforceAuth error:', message);
    response.status(500).json({ error: 'Failed to get Salesforce auth', message });
  }
}
