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
            // I created this PAT on the server with an expiration of 1 year
            'Credential-Key': 'TC_DEMO',
            'Credential-Value': '1XXKvOu+QvaEaRE1eZg07Q==:RwvUkn9HklJ910LU1zelRLvOeI6scSPP'
        }
    }
    // The developer.salesforce address is the address of our HBI production server
    const response = await fetch('https://developer.salesforce.com/tools/tableau/headless-bi/v1/query-datasource', post);
    const jsonResponse = await response.json() as QueryOutput;
    return jsonResponse;
}