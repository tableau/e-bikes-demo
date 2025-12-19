# Salesforce Analytics Agent Integration Setup Guide

This guide explains how to configure the Salesforce Analytics Agent component integration in the e-bikes demo application.

## Overview

The Salesforce Analytics Agent is embedded next to the existing chat window in the AI Assistant page (`/McKenzie/ai-assistant`). The integration uses JWT Bearer Flow authentication, which requires configuration in your Salesforce org.

## Prerequisites

1. **Salesforce Org Access**: You need admin access to a Salesforce org
2. **Node.js Environment**: The application must be running with Node.js
3. **Private Key**: A private/public key pair for JWT signing

## Step 1: Create External Client App (ECA) in Salesforce

1. **Navigate to Setup**:
   - Log in to your Salesforce org
   - Go to **Setup** (gear icon in the top right)
   - In the Quick Find box, search for "External Client App Manager"
   - Click on **External Client App Manager**

2. **Create New External Client App**:
   - Click **New External Client App**
   - Fill in the required fields:
     - **Name**: `E-Bikes Demo Analytics` (or your preferred name)
     - **API Name**: Auto-filled based on name
     - **Contact Email**: Your email address
     - **Distribution State**: Select **Local** for development/testing

3. **Enable OAuth**:
   - Click **Enable OAuth**
   - **Callback URL**: `https://your-app-url.com/callback` (can be a placeholder for JWT flow)
   - **OAuth Scopes**: Select the following:
     - `Manage user data via APIs (api)`
     - `Manage user data via Web browsers (web)`
     - `Access Lightning applications (lightning)`
     - `Access Analytics Cloud APIs (analytics_api)`

4. **Configure JWT Bearer Flow**:
   - Under **Flow Enablement**, select **JWT Bearer Flow**
   - **Note**: You'll upload the certificate after generating it in Step 2
   - **Important**: Salesforce External Client App only accepts `.crt` certificate files for upload
   - If using **Option A (Salesforce Certificate Management)**: Upload the `.crt` file after downloading it in Step 2
   - If using **Option B (Manual Generation)**: You must create a `.crt` certificate file (see Step 2 for conversion instructions)

5. **Save Configuration**:
   - Click **Save**
   - After saving, note the **Consumer Key** (Client ID) - you'll need this for environment variables
   - **Important**: If you haven't uploaded the certificate yet, you'll need to edit this External Client App after Step 2 to upload the `.crt` file

## Step 2: Generate Private/Public Key Pair

You need to generate an RSA key pair for JWT signing. You have two options:

### Option A: Using Salesforce Certificate and Key Management (Recommended)

This is the easiest and most integrated approach:

1. **Navigate to Certificate and Key Management**:
   - Log in to your Salesforce org
   - Go to **Setup** (gear icon in the top right)
   - In the Quick Find box, search for "Certificate and Key Management"
   - Click on **Certificate and Key Management**

2. **Create Self-Signed Certificate**:
   - Click **Create Self-Signed Certificate**
   - Fill in the required fields:
     - **Label**: `E-Bikes Demo Analytics` (or your preferred name)
     - **Unique Name**: Auto-filled based on label
     - **Key Size**: `2048` (recommended)
     - **Exportable Private Key**: ✅ **Check this box** (required to download the private key)
   - Click **Save**

3. **Download the Private Key**:
   - After creation, find your certificate in the list
   - Click on the certificate name to open its details
   - Click **Download Private Key**
   - Save the `.key` file securely (you'll only see this once)
   - The private key will be in PKCS#8 format, ready to use

4. **Download the Certificate**:
   - On the certificate detail page, click **Download Certificate**
   - Save the `.crt` file
   - This is your public certificate (you'll upload this to the External Client App in Step 1)

5. **Upload Certificate to External Client App**:
   - Go back to your External Client App (from Step 1)
   - Under **JWT Bearer Flow**, click **Upload Certificate**
   - Upload the `.crt` file you just downloaded
   - Click **Save**

**Advantages of this approach**:
- No need for OpenSSL or command-line tools
- Certificates are managed directly in Salesforce
- Easier to track and rotate certificates
- Integrated with Salesforce security features
- Private key is already in the correct PKCS#8 format

**Important Notes**:
- The private key is only shown once when you download it - store it securely
- Ensure "Exportable Private Key" is checked when creating the certificate
- Self-signed certificates from Salesforce don't expire by default

### Option B: Manual Key Generation (Alternative)

If you prefer to generate keys manually, you must create both a private key and a `.crt` certificate file. Salesforce External Client App only accepts `.crt` files for upload.

#### Using OpenSSL:

```bash
# Generate private key
openssl genrsa -out private_key.pem 2048

# Create a self-signed certificate (.crt file) - REQUIRED for Salesforce upload
openssl req -new -x509 -key private_key.pem -out certificate.crt -days 365 -subj "/CN=E-Bikes Demo Analytics"

# Convert private key to PKCS#8 format (if needed)
openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt -in private_key.pem -out private_key_pkcs8.pem
```

**Important**: The `certificate.crt` file is what you'll upload to Salesforce External Client App.

#### Using Node.js:

```javascript
const crypto = require('crypto');
const fs = require('fs');

// Generate key pair
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

// Save private key
fs.writeFileSync('private_key.pem', privateKey);

// Create a self-signed certificate
const cert = crypto.createCertificate({
  publicKey: publicKey,
  serialNumber: '1',
  subject: { CN: 'E-Bikes Demo Analytics' },
  issuer: { CN: 'E-Bikes Demo Analytics' },
  notBefore: new Date(),
  notAfter: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
});

// Note: Node.js crypto.createCertificate() is deprecated
// For production, use OpenSSL to create the .crt file, or use a library like 'pem'
```

**For Node.js users**: It's recommended to use OpenSSL to create the `.crt` file, as Node.js's built-in certificate creation is limited. Alternatively, you can use the `pem` npm package:

```bash
npm install pem
```

```javascript
const pem = require('pem');

pem.createCertificate({ days: 365, selfSigned: true }, (err, keys) => {
  if (err) throw err;
  
  // Save certificate (.crt file)
  fs.writeFileSync('certificate.crt', keys.certificate);
  
  // Save private key
  fs.writeFileSync('private_key.pem', keys.serviceKey);
});
```

**Important**: 
- Keep the private key secure and never commit it to version control
- You must upload the `.crt` certificate file (not just the public key) to Salesforce External Client App
- The private key will be used in your environment variables
- The `.crt` file must be in PEM format (which is the default for OpenSSL)

## Step 3: Assign Permission Sets

Users who will access the embedded Analytics Agent need appropriate permissions:

1. **Navigate to Permission Sets**:
   - In Salesforce Setup, search for "Permission Sets"
   - Click on **Permission Sets**

2. **Clone Tableau Next Consumer Permission Set**:
   - Find **Tableau Next Consumer** permission set
   - Click the dropdown and select **Clone**
   - Provide a new label: `Tableau Next Consumer JWT` (or your preferred name)
   - Click **Save**

3. **Assign Permission Set to Users**:
   - Open your cloned permission set
   - Click **Manage Assignments**
   - Click **Add Assignments**
   - Select the users who need access
   - Click **Assign**

## Step 4: Configure Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Salesforce Configuration
VITE_SALESFORCE_ORG_URL=https://yourorg.lightning.force.com
VITE_SALESFORCE_CONSUMER_KEY=your_consumer_key_from_eca

# Option 1: Use file path (RECOMMENDED)
VITE_SALESFORCE_PRIVATE_KEY_PATH=./keys/salesforce_private_key.pem

# Option 2: Direct key entry (only if not using file path)
# VITE_SALESFORCE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_CONTENT\n-----END PRIVATE KEY-----"

VITE_SALESFORCE_USERNAME=user@example.com
```

### Important Notes:

1. **VITE_SALESFORCE_ORG_URL**: 
   - Your Salesforce org URL (e.g., `https://myorg.lightning.force.com`)
   - Do not include trailing slash

2. **VITE_SALESFORCE_CONSUMER_KEY**:
   - The Consumer Key from your External Client App
   - Found in Setup > External Client App Manager > Your App > Consumer Key

3. **VITE_SALESFORCE_PRIVATE_KEY_PATH** (Recommended):
   - Path to your private key PEM file
   - Can be absolute or relative to the project root
   - **Recommended approach**: Store your private key in a file and reference it
   - Example: `VITE_SALESFORCE_PRIVATE_KEY_PATH=./keys/salesforce_private_key.pem`
   - Example: `VITE_SALESFORCE_PRIVATE_KEY_PATH=/absolute/path/to/private_key.pem`
   - **If this is set, `VITE_SALESFORCE_PRIVATE_KEY` will be ignored**
   - **Security tip**: Store the key file outside the project directory or ensure it's in `.gitignore`

4. **VITE_SALESFORCE_PRIVATE_KEY** (Alternative):
   - Your private key in PEM format (direct entry)
   - Only use this if `VITE_SALESFORCE_PRIVATE_KEY_PATH` is not set
   - Must include `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` headers
   - Use `\n` for newlines in the environment variable
   - **If using Salesforce Certificate Management (Option A)**: The downloaded `.key` file should already have the correct format. Copy the entire content including headers.
   - **If using manual generation (Option B)**: Ensure the key is in PKCS#8 format
   - Example format:
     ```
     VITE_SALESFORCE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----"
     ```

5. **VITE_SALESFORCE_USERNAME**:
   - The Salesforce username (email) that will be used for authentication
   - This user must have the permission set assigned (Step 3)

## Step 5: Verify Configuration

1. **Start the Application**:
   ```bash
   npm run dev
   ```

2. **Navigate to AI Assistant Page**:
   - Go to `http://localhost:4001/McKenzie/ai-assistant`
   - On desktop (window width > 1200px), you should see:
     - Chat window on the left
     - Salesforce Analytics Agent on the right

3. **Check Browser Console**:
   - Open browser developer tools (F12)
   - Check for any authentication errors
   - Verify SDK initialization messages

4. **Check Server Logs**:
   - Look for JWT generation and token exchange logs
   - Verify no authentication errors

## Troubleshooting

### Authentication Errors

**Error: "Salesforce private key not configured"**
- Verify either `VITE_SALESFORCE_PRIVATE_KEY_PATH` or `VITE_SALESFORCE_PRIVATE_KEY` is set in your `.env` file
- If using file path: Ensure the file exists and the path is correct (can be absolute or relative to project root)
- If using direct key: Ensure the private key includes proper headers and newlines (`\n`)
- Check file permissions if using `VITE_SALESFORCE_PRIVATE_KEY_PATH`

**Error: "Salesforce consumer key not configured"**
- Verify `VITE_SALESFORCE_CONSUMER_KEY` is set correctly
- Double-check the Consumer Key from your External Client App

**Error: "Salesforce org URL not configured"**
- Verify `VITE_SALESFORCE_ORG_URL` is set
- Ensure it's in the format: `https://yourorg.lightning.force.com`

**Error: "Failed to exchange Salesforce token"**
- Verify the `.crt` certificate file is uploaded to your External Client App (only `.crt` files are accepted)
- Ensure the private key matches the certificate
- Check that JWT Bearer Flow is enabled in the External Client App
- Verify the username has the required permission set assigned
- Ensure the certificate file is in PEM format (standard `.crt` format)

### SDK Initialization Errors

**Error: "SDK initialization failed"**
- Check that the access token is valid
- Verify the org URL is correct
- Ensure the user has proper permissions

**Analytics Agent Not Displaying**:
- Check browser console for errors
- Verify the SDK is initialized successfully
- Ensure the container element exists in the DOM

### Layout Issues

**Split layout not showing**:
- Ensure window width is greater than 1200px
- Check that `isSidePane` prop is `false`
- Verify CSS styles are loaded correctly

**Mobile layout issues**:
- On mobile (< 768px), the layout should stack vertically
- Verify responsive CSS is working

## Hardcoded Values Reference

The following values are hardcoded in the implementation:

1. **Token Endpoint Path**: `/services/oauth2/token`
   - Location: `src/server/salesforceAuth.ts`
   - This is the standard Salesforce OAuth token endpoint

2. **JWT Grant Type**: `urn:ietf:params:oauth:grant-type:jwt-bearer`
   - Location: `src/server/salesforceAuth.ts`
   - Standard OAuth 2.0 JWT Bearer grant type

3. **JWT Algorithm**: `RS256`
   - Location: `src/server/getJwt.ts`
   - Required by Salesforce for JWT Bearer Flow

4. **JWT Expiration**: 5 minutes
   - Location: `src/server/getJwt.ts`
   - Tokens expire after 5 minutes for security

5. **Split Layout Breakpoint**: 1200px
   - Location: `src/client/components/analytics/AIAssistent.tsx`
   - Desktop layout threshold

## Security Best Practices

1. **Never commit private keys** to version control
2. **Use environment variables** for all sensitive configuration
3. **Rotate keys regularly** for production environments
4. **Limit permission set assignments** to only necessary users
5. **Monitor access logs** in Salesforce for suspicious activity
6. **Use HTTPS** in production environments

## Additional Resources

- [Salesforce External Client App Documentation](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_auth_connected_app.htm)
- [Salesforce Analytics Embedding SDK](https://www.npmjs.com/package/@salesforce/analytics-embedding-sdk)
- [JWT Bearer Flow Documentation](https://help.salesforce.com/s/articleView?id=sf.remoteaccess_oauth_jwt_flow.htm)

## Support

If you encounter issues not covered in this guide:

1. Check the browser console for detailed error messages
2. Review server logs for authentication flow details
3. Verify all environment variables are set correctly
4. Ensure your Salesforce org configuration matches the requirements

