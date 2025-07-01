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

CRITICAL INSTRUCTIONS:
1. When users ask questions about their data, IMMEDIATELY use the tools to get the actual data - don't just describe what you will do.
2. ALWAYS use the datasource "eBikes Inventory and Sales" for data questions unless they specify a different datasource.
3. For data analysis questions, follow this sequence:
   - Use read-metadata or list-fields to understand the data structure
   - Use query-datasource to get the actual data needed to answer the question
   - Analyze the results and provide insights
4. Don't say "I will do X" - just do X immediately using the available tools.
5. Provide clear, actionable insights based on the actual data retrieved.`,
      };

      // Prepare conversation history
      const conversationMessages = [
        systemMessage,
        ...messages,
        { role: 'user' as const, content: query }
      ];

      // Iterative tool calling with multiple rounds
      let currentMessages: OpenAI.ChatCompletionMessageParam[] = [...conversationMessages];
      const allToolResults: any[] = [];
      let finalResponse = '';
      const maxIterations = 5; // Prevent infinite loops
      let iteration = 0;
      let lastCompletion: OpenAI.ChatCompletion | null = null;

      while (iteration < maxIterations) {
        iteration++;
        console.log(`MCP Chat iteration ${iteration}`);

        // Call OpenAI with tools
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: currentMessages,
          tools: openaiTools,
          tool_choice: 'auto',
        });

        lastCompletion = completion;
        const assistantMessage = completion.choices[0].message;
        currentMessages.push(assistantMessage);

        // If no tool calls, we're done
        if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
          finalResponse = assistantMessage.content || '';
          break;
        }

        // Execute all tool calls in this iteration
        const iterationToolResults: any[] = [];
        for (const toolCall of assistantMessage.tool_calls) {
          try {
            const toolName = toolCall.function.name;
            const toolArgs = JSON.parse(toolCall.function.arguments);
            
            console.log(`Executing tool: ${toolName} with args:`, toolArgs);
            
            // Execute tool via MCP
            const result = await client.callTool({
              name: toolName,
              arguments: toolArgs,
            });
            
            const toolResult = {
              tool: toolName,
              arguments: toolArgs,
              result: result.content,
            };
            
            iterationToolResults.push(toolResult);
            allToolResults.push(toolResult);

            // Add tool result to conversation
            currentMessages.push({
              role: 'tool',
              content: JSON.stringify(result.content),
              tool_call_id: toolCall.id,
            } as OpenAI.ChatCompletionToolMessageParam);

          } catch (toolError) {
            console.error('Tool execution error:', toolError);
            const errorResult = {
              tool: toolCall.function.name,
              arguments: toolCall.function.arguments,
              error: toolError instanceof Error ? toolError.message : String(toolError),
            };
            
            iterationToolResults.push(errorResult);
            allToolResults.push(errorResult);

            // Add error to conversation
            currentMessages.push({
              role: 'tool',
              content: JSON.stringify({ error: errorResult.error }),
              tool_call_id: toolCall.id,
            } as OpenAI.ChatCompletionToolMessageParam);
          }
        }

        console.log(`Iteration ${iteration} completed ${iterationToolResults.length} tool calls`);
      }

      // If we hit max iterations, make one final call for a response
      if (iteration >= maxIterations && !finalResponse) {
        console.log('Max iterations reached, getting final response');
        const finalCompletion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: currentMessages,
        });
        finalResponse = finalCompletion.choices[0].message.content || '';
      }

      res.json({
        response: finalResponse,
        toolResults: allToolResults,
        usage: lastCompletion?.usage,
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