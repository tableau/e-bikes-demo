import Base64 from 'crypto-js/enc-base64';
import Utf8 from 'crypto-js/enc-utf8';
import hmacSHA256 from 'crypto-js/hmac-sha256';
import WordArray from 'crypto-js/lib-typedarrays';
import { v4 as uuidv4 } from 'uuid';
import { User } from './App';

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

export function getJwt(user: User) {

  const secretValue = 'atZ7HITCyV4nwi3gLzPsZt6+haXfjiYauu1lj4i0GDA=';
  const secretId = '30baa038-146e-44f7-8d31-9f5d6bea1b13'
  const clientId = '25c68ec4-3600-40a3-aaed-26a748e29fb3';

  const scopes = ["tableau:views:embed", "tableau:views:embed_authoring", "tableau:insights:embed", "tableau:insight_metrics:read", "tableau:insights:read"];
  const username = "embedded@ebikes.com";


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
    retailer: user.retailer,
    license: user.hasPremiumLicense ? "Premium" : "Basic",
  };

  const encodedHeader = base64url(Utf8.parse(JSON.stringify(header)));
  const encodedData = base64url(Utf8.parse(JSON.stringify(data)));

  const token = `${encodedHeader}.${encodedData}`;
  const signature = base64url(hmacSHA256(token, secretValue));

  return `${token}.${signature}`;
}


