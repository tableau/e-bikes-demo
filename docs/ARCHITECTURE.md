# E-Bikes Demo Application - Architecture Documentation

## **Basic Architecture Overview**

### **Technology Stack**
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js (Node.js)
- **Integration**: Tableau Embedding API v3
- **Build Tool**: Vite
- **Routing**: React Router v7

---

## **Architecture Pattern: Full-Stack Application**

### **1. Client-Side Architecture (`src/client/`)**

**Entry Point:**
- `main.tsx` - React application entry point, wraps the app with `BrowserRouter`
- `App.tsx` - Root component with routing and context providers

**Component Structure:**
```
src/client/
├── components/
│   ├── analytics/     # Tableau embedding components (dashboards, Pulse metrics)
│   ├── auth/          # Login and authentication UI
│   ├── header/        # Navigation header with notifications
│   ├── home/          # Home page component
│   └── productCatalog/ # Product catalog with VDS integration
├── constants/         # Configuration constants (Tableau server URLs)
├── hooks/             # Custom React hooks (GA tracking, mobile detection)
└── App.module.css     # Global styles
```

**Key Features:**
- Context API (`App.tsx`) for global state management (notifications, user license)
- Route-based navigation with user-specific paths (`/:userId/home`, `/:userId/product-catalog`)
- Mobile detection and route guards

---

### **2. Server-Side Architecture (`src/server/`)**

**Main Server (`server.ts`):**
- Express server with Vite integration
- Serves static files from `/dist` in production
- API proxy endpoints for Tableau Cloud

**API Endpoints:**
```
GET  /getJwt              # Generate JWT token for Tableau authentication
GET  /api/:version/:path  # Proxy GET requests to Tableau Cloud
POST /api/:version/:path  # Proxy POST requests to Tableau Cloud
POST /mcp-chat            # MCP chat endpoint
POST /mcp-chat-stream     # MCP chat streaming endpoint
GET  /system-prompt       # Get system prompt for MCP
```

**Key Server Files:**
- `getJwt.ts` - Creates JWT tokens using Connected Apps authentication
- `get.ts` / `post.ts` - Proxy handlers for Tableau REST API calls
- `signin.ts` - Authenticates with Tableau using JWT
- `hbi.ts` - Handles HBI (Hyper Bridge Interface) queries for VDS
- `mcp-chat.ts` - MCP chat integration

---

### **3. Data Flow Architecture**

**Authentication Flow:**
```
1. User logs in → Client requests JWT from /getJwt
2. Server generates JWT using Connected Apps credentials
3. Client stores JWT and includes it in Tableau API requests
4. Server proxies requests to Tableau Cloud with JWT authentication
```

**Tableau Integration Flow:**
```
Client Component
    ↓ (requests data with JWT)
Express Server (/api/*)
    ↓ (signs in with JWT, gets auth token)
Tableau Cloud API
    ↓ (returns data)
Express Server
    ↓ (proxies response)
Client Component
```

**VDS (VizQL Data Service) Flow:**
```
Client Hook (e.g., useProductSales)
    ↓ (builds query object)
POST /api/-/hbi-query
    ↓ (authenticates, calls HBI)
Tableau Cloud HBI API
    ↓ (returns query results)
Client Component (renders data)
```

---

### **4. Key Architectural Patterns**

**1. Proxy Pattern**
- Server acts as a proxy between client and Tableau Cloud
- Handles authentication and CORS issues
- Abstracts Tableau API complexity from the client

**2. JWT-Based Authentication**
- Uses Tableau Connected Apps for SSO
- JWT includes user information, license type, and scopes
- Tokens expire after 10 minutes

**3. Component-Based UI**
- React components organized by feature area
- Custom hooks for data fetching (`useProductSales`, `usePulseAPI`)
- Context API for global state management

**4. User Management**
- Simple in-memory user database (`src/db/users.ts`)
- Two user types: Retailer (McKenzie) and Partner Manager (Mario)
- License types: Basic vs Premium

---

### **5. Tableau Integration Points**

**Embedded Components:**
- `EmbeddedDashboard.tsx` - Embeds Tableau dashboards
- `EmbeddedPulse.tsx` - Embeds Pulse metrics
- `WebAuthoring.tsx` - Embedded web authoring experience
- `AIAssistent.tsx` - AI assistant integration

**Data APIs:**
- **VDS (VizQL Data Service)** - Query data programmatically
- **Pulse API** - Get metric insights and data
- **REST API** - General Tableau Cloud operations

---

### **6. Build & Deployment**

**Development:**
- `npm run dev` - Runs Vite dev server + Express backend
- Hot module replacement for frontend
- Port 4001 (configurable via PORT env var)

**Production:**
- `npm run build` - Builds React app to `/dist`
- `npm start` - Serves production build
- Uses `vite-express` to serve static files + API routes

---

### **7. Environment Configuration**

Uses environment variables for:
- `VITE_SERVER` - Tableau Cloud server URL
- `VITE_SITE` - Tableau site content URL
- `VITE_CLIENT_ID` / `VITE_SECRET_ID` / `VITE_SECRET_VALUE` - Connected Apps credentials
- `VITE_DATASOURCE_LUID` - Data source ID for VDS queries

---

## **Summary**

This is a full-stack demo application showcasing how to embed Tableau analytics into a React application. The Express server handles authentication and proxies Tableau API calls, while the React frontend embeds dashboards, Pulse metrics, and uses VDS for custom data visualizations. The architecture separates concerns: client handles UI, server handles authentication and API proxying, and Tableau Cloud provides analytics capabilities.

