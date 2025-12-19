export const tableauServer = import.meta.env.VITE_SERVER!;
export const site = import.meta.env.VITE_SITE!;
export const subscriber = import.meta.env.VITE_SUBSCRIBER!;
export const datasourceLuid = import.meta.env.VITE_DATASOURCE_LUID!;
export const appServer = import.meta.env.VITE_APP_SERVER ?? '';

// Salesforce Configuration
export const salesforceOrgUrl = import.meta.env.VITE_SALESFORCE_ORG_URL ?? '';
export const salesforceConsumerKey = import.meta.env.VITE_SALESFORCE_CONSUMER_KEY ?? '';
export const salesforceLightningOutAppId = import.meta.env.VITE_SALESFORCE_LIGHTNING_OUT_APP_ID ?? '';