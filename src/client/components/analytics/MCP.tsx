import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import styles from './MCP.module.css';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolResults?: any[];
  timestamp: Date;
}

interface ChatResponse {
  response: string;
  toolResults: any[];
  usage: any;
}

function MCP() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [currentQuery]);

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
    setError(null);

    try {
      const response = await fetch('/mcp-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          query: userMessage.content,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ChatResponse = await response.json();

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        toolResults: data.toolResults,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
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
    setError(null);
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>Tableau AI Assistant</h1>
        <p className={styles.subtitle}>
          Ask questions about your data, dashboards, and analytics. Powered by MCP.
        </p>
        {messages.length > 0 && (
          <button 
            onClick={clearChat}
            style={{ 
              marginTop: '10px', 
              padding: '6px 12px', 
              background: '#dc3545', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
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
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`${styles.message} ${
                    message.role === 'user' ? styles.userMessage : styles.assistantMessage
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <>
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                      {renderToolResults(message.toolResults || [])}
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
              ))}
              
              {isLoading && (
                <div className={styles.loading}>
                  <div>🤖 Thinking...</div>
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

export default MCP; 