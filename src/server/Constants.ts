export const username = process.env.VITE_USERNAME!;
export const clientId = process.env.VITE_CLIENT_ID!;
export const secretId = process.env.VITE_SECRET_ID!;
export const secretValue = process.env.VITE_SECRET_VALUE!;

// OpenAI and Tableau MCP Configuration
export const openaiApiKey = process.env.OPENAI_API_KEY!;
export const tableauPATName = process.env.TABLEAU_PAT_NAME || 'MCP';
export const tableauPATValue = process.env.TABLEAU_PAT_VALUE!;
