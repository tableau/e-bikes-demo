import fetch from 'node-fetch';

// This is the Query to send to HBI
export type Query = {
    // The connection indicates the Tableau Server and Datasource to run the Query against
    connection: {
        tableauServerName: string,
        siteId: string,
        datasource: string
    }
    // Here is the Query. Consult the docs for the exact format.
    query: object
}

export type QueryOutput = {
    data: object[];
}

export async function callHBI(query: Query) {
    const post = {
        method: 'post',
        body: JSON.stringify(query),
        headers: {
            'Content-Type': 'application/json',
            // I created this PAT on the server with an expiration of 1 year (until 6 Nov 2025)
            'Credential-Key': 'ebikes',
            'Credential-Value': 'TEGcZtVXSgqy1HKr91YiUg==:hCEmX5UKhqKFzNwWYLu96DsMUgA9uHyb'
        }
    }
    // The developer.salesforce address is the address of our HBI production server
    const response = await fetch('https://developer.salesforce.com/tools/tableau/headless-bi/v1/query-datasource', post);
    const jsonResponse = await response.json() as QueryOutput;
    return jsonResponse;
}
