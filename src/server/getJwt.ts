import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { Err, Ok, Result } from 'ts-results';
import Base64 from 'crypto-js/enc-base64';
import Utf8 from 'crypto-js/enc-utf8';
import hmacSHA256 from 'crypto-js/hmac-sha256';
import WordArray from 'crypto-js/lib-typedarrays';
import { v4 as uuidv4 } from 'uuid';
import { User, users } from '../db/users';

export type RequestData = {
  server: string;
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

  // CA from https://10ay.online.tableau.com/t/ehofman
  // const secretValue = 'atZ7HITCyV4nwi3gLzPsZt6+haXfjiYauu1lj4i0GDA=';
  // const secretId = '30baa038-146e-44f7-8d31-9f5d6bea1b13'
  // const clientId = '25c68ec4-3600-40a3-aaed-26a748e29fb3';

  // CA from https://us-west-2a.online.tableau.com/t/ehofmanvds
  const secretValue = 'dJ7Zh620Jh0ioiFtRuDke1/nkHwVaed2obFOOOsXnJU=';
  const secretId = 'd3719179-3647-4f66-9940-a2dd4f885e54'
  const clientId = 'b09d0a87-1696-4cd3-adb0-3c25aad0354e';

  const scopes = ["tableau:views:embed", "tableau:views:embed_authoring", "tableau:insights:embed", "tableau:insight_metrics:read", "tableau:insights:read"];
  const username = "embedded@ebikes.com";
  // const username = 'aeskinasy@salesforce.com'


  const header = {
    alg: 'HS256',
    typ: 'JWT',
    kid: secretId,
    iss: clientId,
  };

  const data = {
    jti: uuidv4(),
    iss: clientId,
    aud: 'tableau',
    sub: username,
    scp: scopes,
    iat: Math.floor(Date.now() / 1000) - 5,
    exp: Math.floor(Date.now() / 1000) + 10 * 60,
    retailer: user.isRetailer ? user.company : null,
    license: license,
  };

  const encodedHeader = base64url(Utf8.parse(JSON.stringify(header)));
  const encodedData = base64url(Utf8.parse(JSON.stringify(data)));

  const token = `${encodedHeader}.${encodedData}`;
  const signature = base64url(hmacSHA256(token, secretValue));

  return `${token}.${signature}`;
}


