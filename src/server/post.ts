import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import fetch, { RequestInit } from 'node-fetch';
import { Err, Ok, Result } from 'ts-results';
import { signinAsync } from './signin';
import { callHBI } from './hbi';

export type RequestData = {
  server: string;
  site: string;
  apiVersion: string;
  apiPath: string;
  body: string;
  jwt: string;
};

export async function post(request: ExpressRequest, response: ExpressResponse) {
  try {
    // Glueing HBI POST into here
    if (request.originalUrl.startsWith('/api/-/hbi-query')) {
      const queryResult = await callHBI(request.body)
      try {
        response.send(queryResult);
      } catch (e: unknown) {
        response.send({ error: `${e}`, queryResult });
      }
      return;
    }
    const requestResult = validateRequest(request);
    if (requestResult.err) {
      response.status(400).send({ error: 'invalid_request' });
      return;
    }

    const { server, site, apiVersion, apiPath, body, jwt } = requestResult.val;
    let token = '';
    if (jwt) {
      const signinResult = await signinAsync({ server, apiVersion, site, jwt })
      if (signinResult.err) {
        response.status(400).send(signinResult.val);
        return;
      }

      token = signinResult.val;
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }

    if (token) {
      headers['X-Tableau-Auth'] = token;
    }

    const init: RequestInit = {
      method: 'POST',
      headers,
    };

    if (body) {
      init.body = body;
      if (process.env.NODE_ENV !== 'production') {
        console.log(body);
      }
    }

    const fetchResponse = await fetch(`${server}/api/${apiVersion}/${apiPath}`, init);

    const raw = await fetchResponse.text();
    if (!raw) {
      response.send();
      return;
    }

    try {
      response.send(JSON.parse(raw));
    } catch (e: unknown) {
      response.send({ error: `${e}`, raw });
    }
  } catch (e: unknown) {
    response.send({ error: `${e}` });
  }
}

function validateRequest(request: ExpressRequest): Result<RequestData, void> {
  const params = request.params;

  const server = request.header('server') ?? '';
  const site = request.header('site') ?? '';
  const jwt = request.header('jwt') ?? '';

  const apiVersion = `${params.apiVersion || ''}`;
  const apiPath = `${params.apiPath || ''}${params[0] || ''}`;

  const bodyStr = `${JSON.stringify(request.body) || ''}`;
  const body = bodyStr === '{}' ? '' : bodyStr;
  if (!server || !apiVersion || !apiPath) {
    return Err.EMPTY;
  }

  if (jwt && !site) {
    return Err.EMPTY;
  }

  return new Ok({ server, apiVersion, site, apiPath, body, jwt });
}
