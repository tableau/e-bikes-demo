import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import fetch from 'node-fetch';
import { Err, Ok, Result } from 'ts-results';

export type RequestData = {
  server: string;
  apiVersion: string;
};

export async function serverinfo(request: ExpressRequest, response: ExpressResponse) {
  try {
    const requestResult = validateRequest(request);
    if (requestResult.err) {
      response.status(400).send({ error: 'invalid_request' });
      return;
    }

    const { server, apiVersion } = requestResult.val;
    const fetchResponse = await fetch(`${server}/api/${apiVersion}/serverinfo`, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    response.send(await fetchResponse.json());
  } catch (e: unknown) {
    response.send({ error: `${e}` });
  }
}

function validateRequest(request: ExpressRequest): Result<RequestData, void> {
  const server = `${request.body.server || ''}`;
  const apiVersion = `${request.body.apiVersion || ''}`;
  if (!server || !apiVersion) {
    return Err.EMPTY;
  }

  return new Ok({ server, apiVersion });
}
