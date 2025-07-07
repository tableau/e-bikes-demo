import { Request, Response } from 'express';
import OpenAI from 'openai';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { openaiApiKey } from './Constants';

const MAX_MCP_ITERATIONS = 10;

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
  const serverUrl = 'https://tableau-mcp-proto-d14b2e55a4f4.herokuapp.com/tableau-mcp';

  const transport = new StreamableHTTPClientTransport(new URL(serverUrl));

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
  console.log('🔄 Regular MCP Chat endpoint called (not streaming)');
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
      let iteration = 0;
      let lastCompletion: OpenAI.ChatCompletion | null = null;

      while (iteration < MAX_MCP_ITERATIONS) {
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
      if (iteration >= MAX_MCP_ITERATIONS && !finalResponse) {
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

export async function mcpChatStream(req: Request, res: Response) {
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  });

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Send a test event immediately to verify connection
  sendEvent('progress', { 
    message: 'Connection established', 
    step: 'init' 
  });

  try {
    const { messages, query } = req.body as ChatRequest;
    
    console.log(`🚀 NEW MCP ANALYSIS STARTED`);
    console.log(`📋 Query: "${query}"`);
    console.log(`💬 Conversation history: ${messages.length} messages`);
    
    sendEvent('progress', { message: 'Initializing MCP connection...', step: 'init' });
    
    // Create OpenAI client (lazy initialization after env is loaded)
    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });
    
    // Create MCP client
    const { client, transport } = await createMCPClient();
    
    try {
      sendEvent('progress', { message: 'Getting available tools...', step: 'tools' });
      
      // Get available tools from MCP server
      const tools = await client.listTools();
      
      sendEvent('progress', { 
        message: `Found ${tools.tools.length} tools: ${tools.tools.map(t => t.name).join(', ')}`, 
        step: 'tools-found' 
      });
      
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
      let iteration = 0;
      let lastCompletion: OpenAI.ChatCompletion | null = null;

      sendEvent('progress', { 
        message: 'Starting analysis...', 
        step: 'analysis-start',
        maxIterations: MAX_MCP_ITERATIONS 
      });

      while (iteration < MAX_MCP_ITERATIONS) {
        iteration++;
        
        console.log(`🔄 === ITERATION ${iteration}/${MAX_MCP_ITERATIONS} ===`);
        console.log(`📝 Current conversation has ${currentMessages.length} messages`);
        
        sendEvent('progress', { 
          message: `Iteration ${iteration}/${MAX_MCP_ITERATIONS}: Analyzing and planning...`, 
          step: 'iteration-start',
          iteration 
        });

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

        console.log(`🤖 OpenAI responded with ${assistantMessage.tool_calls?.length || 0} tool calls`);
        if (assistantMessage.content) {
          console.log(`💬 Assistant message: ${assistantMessage.content.substring(0, 100)}...`);
        }

        // If no tool calls, we're done
        if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
          finalResponse = assistantMessage.content || '';
          console.log(`✅ No more tool calls needed. Final response: ${finalResponse.substring(0, 100)}...`);
          sendEvent('progress', { 
            message: 'Analysis complete - generating final response...', 
            step: 'complete' 
          });
          break;
        }

        sendEvent('progress', { 
          message: `Executing ${assistantMessage.tool_calls.length} tool(s)...`, 
          step: 'tools-executing',
          toolCount: assistantMessage.tool_calls.length
        });

        // Execute all tool calls in this iteration
        const iterationToolResults: any[] = [];
        console.log(`🛠️  Executing ${assistantMessage.tool_calls.length} tool call(s):`);
        
        for (const toolCall of assistantMessage.tool_calls) {
          try {
            const toolName = toolCall.function.name;
            const toolArgs = JSON.parse(toolCall.function.arguments);
            
            console.log(`🔧 Calling ${toolName} with args:`, JSON.stringify(toolArgs, null, 2));
            
            sendEvent('progress', { 
              message: `${toolName}(${Object.keys(toolArgs).map(k => `${k}: ${JSON.stringify(toolArgs[k])}`).join(', ')})`, 
              step: 'tool-executing',
              tool: toolName,
              arguments: toolArgs
            });
            
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

            console.log(`✅ ${toolName} completed successfully. Result:`, JSON.stringify(result.content, null, 2).substring(0, 300) + '...');

            sendEvent('progress', { 
              message: `${toolName} completed successfully`, 
              step: 'tool-completed',
              tool: toolName,
              success: true
            });

            // Add tool result to conversation
            currentMessages.push({
              role: 'tool',
              content: JSON.stringify(result.content),
              tool_call_id: toolCall.id,
            } as OpenAI.ChatCompletionToolMessageParam);

          } catch (toolError) {
            console.error(`❌ ${toolCall.function.name} FAILED:`, toolError);
            const errorResult = {
              tool: toolCall.function.name,
              arguments: toolCall.function.arguments,
              error: toolError instanceof Error ? toolError.message : String(toolError),
            };
            
            iterationToolResults.push(errorResult);
            allToolResults.push(errorResult);

            sendEvent('progress', { 
              message: `❌ ${toolCall.function.name} failed: ${errorResult.error}`, 
              step: 'tool-error',
              tool: toolCall.function.name,
              error: errorResult.error
            });

            // Add error to conversation
            currentMessages.push({
              role: 'tool',
              content: JSON.stringify({ error: errorResult.error }),
              tool_call_id: toolCall.id,
            } as OpenAI.ChatCompletionToolMessageParam);
          }
        }

        console.log(`🏁 Iteration ${iteration} completed:`);
        console.log(`   - ${iterationToolResults.length} tool(s) executed`);
        console.log(`   - ${iterationToolResults.filter(r => !r.error).length} successful`);
        console.log(`   - ${iterationToolResults.filter(r => r.error).length} failed`);
        
        sendEvent('progress', { 
          message: `Iteration ${iteration} completed - ${iterationToolResults.length} tool(s) executed`, 
          step: 'iteration-complete',
          iteration,
          toolsExecuted: iterationToolResults.length
        });
      }

      // If we hit max iterations, make one final call for a response
      if (iteration >= MAX_MCP_ITERATIONS && !finalResponse) {
        sendEvent('progress', { 
          message: 'Max iterations reached - generating final response...', 
          step: 'max-iterations' 
        });
        
        const finalCompletion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: currentMessages,
        });
        finalResponse = finalCompletion.choices[0].message.content || '';
      }

      // Send final result
      sendEvent('result', {
        response: finalResponse,
        toolResults: allToolResults,
        usage: lastCompletion?.usage,
        iterations: iteration
      });

      sendEvent('done', { message: 'Stream complete' });

    } finally {
      // Cleanup
      await client.close();
      await transport.close();
    }

  } catch (error) {
    console.error('MCP Chat stream error:', error);
    sendEvent('error', { 
      error: 'Failed to process chat request', 
      details: error instanceof Error ? error.message : String(error)
    });
  } finally {
    res.end();
  }
} 