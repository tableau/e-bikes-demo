export const username = process.env.VITE_USERNAME!;
export const clientId = process.env.VITE_CLIENT_ID!;
export const secretId = process.env.VITE_SECRET_ID!;
export const secretValue = process.env.VITE_SECRET_VALUE!;

// OpenAI and Tableau MCP Configuration
export const openaiApiKey = process.env.OPENAI_API_KEY!;
export const tableauPATName = process.env.TABLEAU_PAT_NAME || 'MCP';
export const tableauPATValue = process.env.TABLEAU_PAT_VALUE!;

// Salesforce Configuration (Optional - only required if using Analytics Agent)
export const salesforceOrgUrl = process.env.VITE_SALESFORCE_ORG_URL || '';
export const salesforceConsumerKey = process.env.VITE_SALESFORCE_CONSUMER_KEY || '';
export const salesforcePrivateKey = process.env.VITE_SALESFORCE_PRIVATE_KEY || '';
export const salesforcePrivateKeyPath = process.env.VITE_SALESFORCE_PRIVATE_KEY_PATH || '';
export const salesforceUsername = process.env.VITE_SALESFORCE_USERNAME || '';
