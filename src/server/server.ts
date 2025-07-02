import dotenv from 'dotenv';
dotenv.config();

import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import path from 'path';
import ViteExpress from 'vite-express';

import { get } from './get';
import { post } from './post';
import { getJwt } from './getJwt';
import { mcpChat, mcpChatStream } from './mcp-chat';

const port = (process.env.PORT && parseInt(process.env.PORT, 10)) || 5001;

const root = path.join(__dirname, '../dist');

const app = express();

app.use('/', express.static(root))
   .use(cors())
   .use(bodyParser.json());

// Add error handling middleware
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('Error:', err);
  res.status(500).send({ error: err.message });
});

app.get('/getJwt', getJwt);
app.post('/mcp-chat', mcpChat);
app.post('/mcp-chat-stream', mcpChatStream);
app.get('/api/:apiVersion/:apiPath*', get);
app.post('/api/:apiVersion/:apiPath*', post);

if (process.env.NODE_ENV !== 'test') {
  if (process.env.NODE_ENV === 'production') {
    ViteExpress.config({ mode: "production" })
  }
  
  ViteExpress.listen(app, port, () => {
    console.log(`Server started at ${new Date().toISOString()}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Navigate to http://localhost:${port}`);
  });
}

export default app;
