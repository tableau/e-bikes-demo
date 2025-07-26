import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import styles from './AIAssistent.module.css';
import AIAssistentDataVisuzliation from './AIAssistentDataVisuzliation';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolResults?: any[];
  timestamp: Date;
}

// Helper function to detect if a message contains Vega-Lite specifications
const hasVegaLiteSpecs = (message: ChatMessage): boolean => {
  // Check for JSON code blocks that contain Vega-Lite specifications
  const jsonBlockRegex = /```json\s*(\{[\s\S]*?\})\s*```/g;
  let match;
  
  while ((match = jsonBlockRegex.exec(message.content)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      // Check if the spec is nested inside a vegaLite property
      let spec = parsed;
      if (parsed.vegaLite) {
        spec = parsed.vegaLite;
      }
      
      // Check if this is a Vega-Lite specification by structure
      const isVegaLite = (
        (spec.$schema && spec.$schema.includes('vega-lite')) ||
        (spec.data && spec.encoding && (spec.mark || spec.layer)) ||
        (spec.data && spec.mark && (spec.encoding || spec.transform))
      );
      
      if (isVegaLite) {
        return true;
      }
    } catch (e) {
      // Invalid JSON, continue checking
    }
  }
  
  // Check tool results for Pulse tools with successful Vega-Lite specs
  if (message.toolResults) {
    for (const result of message.toolResults) {
      if (result.tool && result.tool.includes('pulse') && result.result) {
        for (const item of result.result) {
          if (item.type === 'text' && item.text) {
            try {
              const parsed = JSON.parse(item.text);
              if (parsed.bundle_response?.result?.insight_groups) {
                for (const group of parsed.bundle_response.result.insight_groups) {
                  if (group.insights) {
                    for (const insight of group.insights) {
                      if (insight.result?.viz && insight.result.viz.$schema) {
                        return true;
                      }
                    }
                  }
                }
              }
            } catch (e) {
              // Parsing failed, continue
            }
          }
        }
      }
    }
  }
  
  return false;
};

// Helper function to remove Vega-Lite JSON blocks from content when they're being rendered as charts
const filterVegaLiteFromContent = (content: string): string => {
  let filteredContent = content;
  
  // Remove the entire Visualization section that contains Vega-Lite JSON
  filteredContent = filteredContent.replace(
    /#{1,6}\s*Visualization\s*\n[\s\S]*?```json\s*\{[\s\S]*?\}\s*```/g,
    ''
  );
  
  // Also remove standalone Vega-Lite JSON blocks
  const jsonBlockRegex = /```json\s*(\{[\s\S]*?\})\s*```/g;
  filteredContent = filteredContent.replace(jsonBlockRegex, (match, jsonContent) => {
    try {
      const parsed = JSON.parse(jsonContent);
      // Check if the spec is nested inside a vegaLite property
      let spec = parsed;
      if (parsed.vegaLite) {
        spec = parsed.vegaLite;
      }
      
      // Check if this is a Vega-Lite specification by structure  
      const isVegaLite = (
        (spec.$schema && spec.$schema.includes('vega-lite')) ||
        (spec.data && spec.encoding && (spec.mark || spec.marks || spec.layer)) ||
        (spec.data && spec.mark && (spec.encoding || spec.transform))
      );
      
      if (isVegaLite) {
        // Remove this JSON block since it will be rendered as a chart
        return '';
      }
    } catch (e) {
      // Invalid JSON, keep as is
    }
    
    return match;
  });
  
  // Remove broken image tags that reference Vega-Lite schema URLs
  filteredContent = filteredContent.replace(
    /!\[[^\]]*\]\(https:\/\/vega\.github\.io\/schema\/vega-lite\/[^)]*\)/g,
    ''
  );
  
  // Remove any sections that mention "Vega-Lite Specifications:" since the specs will be rendered as charts
  filteredContent = filteredContent.replace(
    /#{1,6}\s*Vega-Lite Specifications?:?\s*$/gm,
    ''
  );
  
  // Clean up extra whitespace and empty lines
  filteredContent = filteredContent.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return filteredContent;
};

interface ChatResponse {
  response: string;
  toolResults: any[];
  usage: any;
  iterations?: number;
}

interface ProgressUpdate {
  message: string;
  step: string;
  iteration?: number;
  maxIterations?: number;
  tool?: string;
  arguments?: any;
  toolCount?: number;
  toolsExecuted?: number;
  success?: boolean;
  error?: string;
}

interface MessageToggles {
  showTools: boolean;
  showCharts: boolean;
}

function AIAssistent() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showProgress, setShowProgress] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progressUpdates, setProgressUpdates] = useState<ProgressUpdate[]>([]);
  
  // Toggle states per message - using message index as key
  const [messageToggles, setMessageToggles] = useState<{ [messageIndex: number]: MessageToggles }>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const progressContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  };

  // Scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Scroll when loading state changes
  useEffect(() => {
    scrollToBottom();
  }, [isLoading]);

  // Scroll when progress updates change (to keep latest progress visible)
  useEffect(() => {
    scrollToBottom();
  }, [progressUpdates]);

  // Scroll when show progress state changes
  useEffect(() => {
    scrollToBottom();
  }, [showProgress]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [currentQuery]);

  // Auto-scroll progress container to bottom when progress updates change
  useEffect(() => {
    if (progressContainerRef.current) {
      progressContainerRef.current.scrollTop = progressContainerRef.current.scrollHeight;
    }
  }, [progressUpdates]);

  const sendMessage = async () => {
    if (!currentQuery.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: currentQuery.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentQuery('');
    setIsLoading(true);
    setShowProgress(true);
    setError(null);
    setProgressUpdates([]);
    
    // Immediate scroll after user message
    setTimeout(scrollToBottom, 50);

    try {
      // Create a unique request body
      const requestBody = JSON.stringify({
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        query: userMessage.content,
      });

      // Use fetch to handle SSE response
      const response = await fetch('/mcp-chat-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: requestBody,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (!reader) {
        throw new Error('Response body is not readable');
      }

      let finalResult: ChatResponse | null = null;
      let currentEvent = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();

          if (trimmedLine.startsWith('event: ')) {
            currentEvent = trimmedLine.slice(7).trim();
            continue;
          }

          if (trimmedLine.startsWith('data: ')) {
            try {
              const dataStr = trimmedLine.slice(6).trim();
              const data = JSON.parse(dataStr);

              if (currentEvent === 'progress') {
                setProgressUpdates(prev => [...prev, data as ProgressUpdate]);
              } else if (currentEvent === 'result') {
                finalResult = data as ChatResponse;
              } else if (currentEvent === 'error') {
                throw new Error(data.details || data.error);
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', trimmedLine, 'Error:', parseError);
            }
          }
        }
      }

      if (finalResult) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: finalResult.response,
          toolResults: finalResult.toolResults,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);
        // Ensure scroll after adding assistant message
        setTimeout(scrollToBottom, 100);
      } else {
        throw new Error('No final result received');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
      setShowProgress(false);
      setProgressUpdates([]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setMessageToggles({});
    setError(null);
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Helper function to check if message has chart data
  const hasChartData = (message: ChatMessage): boolean => {
    if (!message.toolResults || message.toolResults.length === 0) return false;
    
    // Check if any tool result contains data that would generate a chart
    return message.toolResults.some(result => {
      if (!result.result) return false;
      
      // Parse tool result similar to AIAssistentDataVisuzliation component
      const parseToolResult = (content: any): any[] | null => {
        if (!content) return null;

        try {
          // Handle MCP tool result structure: [{type: "text", text: "JSON_STRING"}]
          if (Array.isArray(content) && content.length > 0 && content[0].type === 'text' && content[0].text) {
            try {
              const parsed = JSON.parse(content[0].text);
              // Check for data array with meaningful content
              if (parsed.data && Array.isArray(parsed.data) && parsed.data.length > 1) {
                // Verify the data has multiple fields (chartable)
                const firstRow = parsed.data[0];
                if (typeof firstRow === 'object' && Object.keys(firstRow).length >= 2) {
                  return parsed.data;
                }
              }
            } catch {
              return null;
            }
          }
          return null;
        } catch {
          return null;
        }
      };

      const tableData = parseToolResult(result.result);
      return tableData !== null;
    });
  };

  const parseAndRenderTables = (content: string) => {
    // More robust markdown table regex
    const tableRegex = /(\|.+\|\s*\n\|[-:\s|]+\|\s*\n(?:\|.+\|\s*\n?)*)/g;
    const parts = content.split(tableRegex);
    
    return parts.map((part, index) => {
      // Check if this part is a markdown table
      if (part.match(/^\|.+\|\s*\n\|[-:\s|]+\|/)) {
        const lines = part.trim().split('\n').filter(line => line.trim());
        if (lines.length < 3) return <span key={index}>{part}</span>;
        
        // Parse header (first line)
        const headerCells = lines[0].split('|')
          .map(cell => cell.trim())
          .filter(cell => cell.length > 0);
        
        // Skip separator line (line 1), parse data rows (from line 2 onwards)
        const dataRows = lines.slice(2)
          .filter(line => line.includes('|'))
          .map(line => 
            line.split('|')
              .map(cell => cell.trim())
              .filter((cell, cellIndex, arr) => {
                // Filter out empty cells at start/end from pipe formatting
                return !(cell === '' && (cellIndex === 0 || cellIndex === arr.length - 1));
              })
          ).filter(row => row.length > 0);
        
        if (headerCells.length === 0 || dataRows.length === 0) {
          return <span key={index}>{part}</span>;
        }
        
        return (
          <div key={index} className={styles.tableWrapper}>
            <table className={styles.markdownTable}>
              <thead className={styles.tableHeader}>
                <tr className={styles.tableRow}>
                  {headerCells.map((header, headerIndex) => (
                    <th key={headerIndex} className={styles.tableHeaderCell} title={header}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {dataRows.map((row, rowIndex) => (
                  <tr key={rowIndex} className={styles.tableRow}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className={styles.tableCell} title={cell}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      } else {
        // Regular text content - render with ReactMarkdown
        if (!part.trim()) return null;
        
        return (
          <ReactMarkdown key={index}>
            {part}
          </ReactMarkdown>
        );
      }
    });
  };

  const renderToolResults = (toolResults: any[]) => {
    if (!toolResults || toolResults.length === 0) return null;

    return (
      <div className={styles.toolResults}>
        <strong>🔧 Tool Usage:</strong>
        {toolResults.map((result, index) => (
          <div key={index}>
            • {result.tool}({JSON.stringify(result.arguments)})
            {result.error && <span style={{ color: 'red' }}> - Error: {result.error}</span>}
          </div>
        ))}
      </div>
    );
  };

  const renderMessageToggles = (message: ChatMessage, messageIndex: number) => {
    // Only show toggles for assistant messages that have tools or charts
    if (message.role !== 'assistant') {
      return null;
    }

    const hasTools = message.toolResults && message.toolResults.length > 0;
    const hasCharts = hasChartData(message);

    // Don't show toggles if there's nothing to toggle
    if (!hasTools && !hasCharts) {
      return null;
    }

    // Get current toggle state for this message (default to false)
    const currentToggles = messageToggles[messageIndex] || { showTools: false, showCharts: false };

    const updateToggle = (field: 'showTools' | 'showCharts', value: boolean) => {
      setMessageToggles(prev => ({
        ...prev,
        [messageIndex]: {
          ...currentToggles,
          [field]: value
        }
      }));
    };

    return (
      <div className={styles.messageToggles}>
        {hasTools && (
          <label className={styles.toggleContainer}>
            <input
              type="checkbox"
              checked={currentToggles.showTools}
              onChange={(e) => updateToggle('showTools', e.target.checked)}
              className={styles.toggleInput}
            />
            <span className={styles.toggleSlider}></span>
            <span className={styles.toggleLabel}>Show tools</span>
          </label>
        )}
        {hasCharts && (
          <label className={styles.toggleContainer}>
            <input
              type="checkbox"
              checked={currentToggles.showCharts}
              onChange={(e) => updateToggle('showCharts', e.target.checked)}
              className={styles.toggleInput}
            />
            <span className={styles.toggleSlider}></span>
            <span className={styles.toggleLabel}>Show chart</span>
          </label>
        )}
      </div>
    );
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>Tableau AI Assistant</h1>
        <p className={styles.subtitle}>
          Ask questions about your data, dashboards, and analytics. Powered by Tableau's MCP.
        </p>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className={styles.clearButton}
          >
            Clear Chat
          </button>
        )}
      </div>

      <div className={styles.chatContainer}>
        <div className={styles.messagesContainer}>
          {messages.length === 0 && !isLoading ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>💬</div>
              <div className={styles.emptyStateText}>Start a conversation</div>
              <div className={styles.emptyStateSubtext}>
                Ask me about your Tableau data sources, fields, or run queries
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => {
                const currentToggles = messageToggles[index] || { showTools: false, showCharts: false };
                const hasVegaSpecs = message.role === 'assistant' && hasVegaLiteSpecs(message);
                const shouldShowCharts = currentToggles.showCharts || hasVegaSpecs;
                
                return (
                  <div
                    key={index}
                    className={`${styles.message} ${message.role === 'user' ? styles.userMessage : styles.assistantMessage
                      }`}
                  >
                    {message.role === 'assistant' ? (
                      <>
                        <div className={styles.messageContent}>
                          {parseAndRenderTables(hasVegaSpecs ? filterVegaLiteFromContent(message.content) : message.content)}
                          {hasVegaSpecs && (
                            <div style={{ marginTop: '16px' }}>
                              <h4>Visualization</h4>
                              <AIAssistentDataVisuzliation
                                toolResults={message.toolResults || []}
                                responseContent={message.content}
                              />
                            </div>
                          )}
                        </div>
                        {renderMessageToggles(message, index)}
                        {currentToggles.showTools && renderToolResults(message.toolResults || [])}
                        {currentToggles.showCharts && !hasVegaSpecs && (
                          <AIAssistentDataVisuzliation
                            toolResults={message.toolResults || []}
                            responseContent={message.content}
                          />
                        )}
                      </>
                    ) : (
                      message.content
                    )}
                    <div style={{
                      fontSize: '11px',
                      opacity: 0.6,
                      marginTop: '4px'
                    }}>
                      {formatTimestamp(message.timestamp)}
                    </div>
                  </div>
                );
              })}

              {(isLoading || showProgress) && (
                <div className={styles.loading}>
                  <div className={styles.loadingHeader}>
                    {isLoading ? '🤖 MCP Analysis in Progress' : '✅ Analysis Complete'}
                  </div>
                  {progressUpdates.length > 0 && (
                    <div className={styles.progressContainer} ref={progressContainerRef}>
                      {progressUpdates.map((update, index) => (
                        <div key={index} className={styles.progressItem}>
                          <span className={styles.progressIcon}>
                            {update.step === 'init' && '🔌'}
                            {update.step === 'tools' && '🔍'}
                            {update.step === 'tools-found' && '🛠️'}
                            {update.step === 'analysis-start' && '🚀'}
                            {update.step === 'iteration-start' && '🔄'}
                            {update.step === 'tools-executing' && '⚙️'}
                            {update.step === 'tool-executing' && '🔧'}
                            {update.step === 'tool-completed' && '✅'}
                            {update.step === 'tool-error' && '❌'}
                            {update.step === 'iteration-complete' && '✨'}
                            {update.step === 'complete' && '🎉'}
                            {update.step === 'max-iterations' && '⏰'}
                          </span>
                          <span className={styles.progressMessage}>
                            {update.message}
                          </span>
                          {update.iteration && update.maxIterations && (
                            <span className={styles.progressBadge}>
                              {update.iteration}/{update.maxIterations}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {progressUpdates.length === 0 && (
                    <div className={styles.progressItem}>
                      <span className={styles.progressIcon}>⏳</span>
                      <span className={styles.progressMessage}>Initializing...</span>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className={`${styles.message} ${styles.assistantMessage}`} style={{
                  borderColor: '#dc3545',
                  backgroundColor: '#f8d7da'
                }}>
                  ❌ Error: {error}
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.inputContainer}>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            value={currentQuery}
            onChange={(e) => setCurrentQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your Tableau data..."
            disabled={isLoading}
            rows={1}
          />
          <button
            className={styles.sendButton}
            onClick={sendMessage}
            disabled={!currentQuery.trim() || isLoading}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AIAssistent; 