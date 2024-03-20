import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import fetch from 'node-fetch';
import { Err, Ok, Result } from 'ts-results';

export type RequestData = {
  server: string;
  apiVersion: string;
  apiPath: string;
  query: string;
};

export async function get(request: ExpressRequest, response: ExpressResponse) {
  try {
    const requestResult = validateRequest(request);
    if (requestResult.err) {
      response.status(400).send({ error: 'invalid_request' });
      return;
    }

    const { server, apiVersion, apiPath } = requestResult.val;
    const fetchResponse = await fetch(`${server}/api/${apiVersion}/${apiPath}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Tableau-Auth': `${request.headers['x-tableau-auth']}`,
      },
    });

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
  const query = `${request.query.query || ''}`;
  if (!server || !apiVersion || !apiPath) {
    return Err.EMPTY;
  }

  return new Ok({ server, apiVersion, apiPath, query });
}
