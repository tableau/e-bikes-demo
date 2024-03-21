import { Err, Ok, Result } from "ts-results";

export type SignInParams = {
  server: string;
  apiVersion: string;
  jwt: string;
  site: string;
}

export async function signinAsync({ server, apiVersion, jwt, site }: SignInParams): Promise<Result<string, string>> {
  const body = {
    credentials: {
      jwt,
      site: {
        contentUrl: site,
      },
    },
  };

  if (apiVersion === '-') {
    apiVersion = '3.21';
  }

  const signinResponse = await fetch(`${server}/api/${apiVersion}/auth/signin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body)
  });

  const raw = await signinResponse.text();
  try {
    const parsed = JSON.parse(raw);
    const token = parsed?.credentials?.token;
    return token ? new Ok(token) : new Err(raw);
  } catch (e: unknown) {
    return new Err(raw);
  }
}