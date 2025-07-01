import { Request, Response } from 'express';
import OpenAI from 'openai';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { openaiApiKey } from './Constants';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  query: string;
}

// Create MCP client connection  
async function createMCPClient() {
  const serverPath = '/Users/ehofman/tableau-mcp/build/index.js';

  const mcpEnv = {
    ...process.env,
    SERVER: `https://${process.env.VITE_SERVER}`,
    SITE_NAME: process.env.VITE_SITE!,
    PAT_NAME: process.env.TABLEAU_PAT_NAME!,
    PAT_VALUE: process.env.TABLEAU_PAT_VALUE!,
    DATASOURCE_CREDENTIALS: "",
    DEFAULT_LOG_LEVEL: "debug",
    INCLUDE_TOOLS: "",
    EXCLUDE_TOOLS: "",
    MAX_RESULT_LIMIT: ""
  };

  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverPath],
    env: mcpEnv
  });

  const client = new Client({
    name: "tableau-chat-client",
    version: "1.0.0",
  }, {
    capabilities: {
      tools: {},
    },
  });

  await client.connect(transport);
  return { client, transport };
}

export async function mcpChat(req: Request, res: Response) {
  try {
    const { messages, query } = req.body as ChatRequest;
    
    // Create OpenAI client (lazy initialization after env is loaded)
    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });
    
    // Create MCP client
    const { client, transport } = await createMCPClient();
    
    try {
      // Get available tools from MCP server
      const tools = await client.listTools();
      
      // Prepare OpenAI tools format
      const openaiTools = tools.tools.map(tool => ({
        type: 'function' as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema,
        },
      }));

      // Create system message with MCP context
      const systemMessage: ChatMessage = {
        role: 'system',
        content: `You are a helpful assistant that can analyze Tableau data using these available tools:
${tools.tools.map(tool => `- ${tool.name}: ${tool.description}`).join('\n')}

When users ask questions about data, dashboards, or analytics, use the appropriate tools to help them. Always explain what you're doing and provide clear, actionable insights.`,
      };

      // Prepare conversation history
      const conversationMessages = [
        systemMessage,
        ...messages,
        { role: 'user' as const, content: query }
      ];

      // Call OpenAI with tools
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: conversationMessages,
        tools: openaiTools,
        tool_choice: 'auto',
      });

      const assistantMessage = completion.choices[0].message;
      let finalResponse = assistantMessage.content || '';
      const toolResults: any[] = [];

      // Handle tool calls
      if (assistantMessage.tool_calls) {
        for (const toolCall of assistantMessage.tool_calls) {
          try {
            const toolName = toolCall.function.name;
            const toolArgs = JSON.parse(toolCall.function.arguments);
            
            // Execute tool via MCP
            const result = await client.callTool({
              name: toolName,
              arguments: toolArgs,
            });
            
            toolResults.push({
              tool: toolName,
              arguments: toolArgs,
              result: result.content,
            });
          } catch (toolError) {
            console.error('Tool execution error:', toolError);
            toolResults.push({
              tool: toolCall.function.name,
              arguments: toolCall.function.arguments,
              error: toolError instanceof Error ? toolError.message : String(toolError),
            });
          }
        }

        // If we have tool results, make another call to get the final response
        if (toolResults.length > 0) {
          const toolMessages = toolResults.map((result, index) => ({
            role: 'tool' as const,
            content: JSON.stringify(result.result || result.error),
            tool_call_id: assistantMessage.tool_calls![index].id,
          }));

          const finalCompletion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              ...conversationMessages,
              assistantMessage,
              ...toolMessages,
            ],
          });

          finalResponse = finalCompletion.choices[0].message.content || '';
        }
      }

      res.json({
        response: finalResponse,
        toolResults,
        usage: completion.usage,
      });

    } finally {
      // Cleanup
      await client.close();
      await transport.close();
    }

  } catch (error) {
    console.error('MCP Chat error:', error);
    res.status(500).json({ 
      error: 'Failed to process chat request', 
      details: error instanceof Error ? error.message : String(error)
    });
  }
} 