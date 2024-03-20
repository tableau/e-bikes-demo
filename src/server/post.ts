import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import fetch, { RequestInit } from 'node-fetch';
import { Err, Ok, Result } from 'ts-results';

export type RequestData = {
  server: string;
  apiVersion: string;
  apiPath: string;
  body: string;
};

export async function post(request: ExpressRequest, response: ExpressResponse) {
  try {
    const requestResult = validateRequest(request);
    if (requestResult.err) {
      response.status(400).send({ error: 'invalid_request' });
      return;
    }

    const { server, apiVersion, apiPath, body } = requestResult.val;
    const init: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Tableau-Auth': `${request.headers['x-tableau-auth']}`,
      },
    };

    if (body) {
      init.body = body;
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

  const server = `${request.query.server || ''}`;
  const apiVersion = `${params.apiVersion || ''}`;
  const apiPath = `${params.apiPath || ''}${params[0] || ''}`;

  const bodyStr = `${JSON.stringify(request.body) || ''}`;
  const body = bodyStr === '{}' ? '' : bodyStr;
  if (!server || !apiVersion || !apiPath) {
    return Err.EMPTY;
  }

  return new Ok({ server, apiVersion, apiPath, body });
}
