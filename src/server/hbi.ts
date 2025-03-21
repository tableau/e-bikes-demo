import fetch from 'node-fetch';
import { server } from "../constants/Constants";

// Define interfaces for your query structure
interface QueryColumn {
    fieldCaption: string;
    fieldAlias?: string;
    sortPriority?: number;
    calculation?: string;
    function?: string;
}

interface QueryFilter {
    filterType: string;
    field: FilterField;
    values?: string[];
    exclude?: boolean;
    periodType?: string;
    dateRangeType?: string;
    rangeN?: number;
}

interface FilterField {
    fieldCaption?: string;
    function?: string;
    calculation?: string
}

// This is the Query to send to HBI
export type Query = {
    // The connection indicates the Tableau Server and Datasource to run the Query against
    datasource: {
        datasourceLuid: string
    }
    // Here is the Query. Consult the docs for the exact format.
    query: {
        fields: QueryColumn[];
        filters: QueryFilter[];
    }
}

export type QueryOutput = {
    data: object[];
}

export async function callHBI(token: string, query: Query) {
    const post = {
        method: 'post',
        body: JSON.stringify(query),
        headers: {
            'Content-Type': 'application/json',
            'Accept': '*/*',
            'X-Tableau-Auth': token,
        }
    }
    const response = await fetch(`https://${server}/api/v1/vizql-data-service/query-datasource`, post);
    if (response.ok) {
        const jsonResponse = await response.json() as QueryOutput;
        return jsonResponse;
    }
    const retval = await response.json();
    return retval;
}
