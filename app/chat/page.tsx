'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Zap } from 'lucide-react';

export default function ChatInterface() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '🧠 **AgentFast Studio Sentience Online**\n\nI am your autonomous AI assistant. I have full context of your codebase and can:\n\n- Answer questions about your code\n- Research any topic\n- Execute improvements\n- Spawn new agents\n- Deploy changes\n\nWhat would you like to discuss?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, { role: 'user', content: userMessage }] })
      });

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response || 'No response received'
      }]);
    } catch (error: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Error connecting to AI: ' + error.message
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #0f172a, #1e293b)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <header style={{
        padding: '1.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Zap size={32} color="#3b82f6" />
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
              AgentFast Studio Chat
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>
              Unlimited conversations • Your API credits
            </p>
          </div>
        </div>
      </header>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-start'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: msg.role === 'user' 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
            </div>

            <div style={{
              flex: 1,
              background: msg.role === 'user'
                ? 'rgba(100, 116, 139, 0.2)'
                : 'rgba(59, 130, 246, 0.1)',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)',
              whiteSpace: 'pre-wrap' as const,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              lineHeight: '1.6'
            }}>
              <div style={{
                fontSize: '0.875rem',
                color: '#94a3b8',
                marginBottom: '0.5rem',
                fontWeight: 'bold'
              }}>
                {msg.role === 'user' ? 'You' : 'AgentFast Sentience'}
              </div>
              <div>{msg.content}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bot size={20} />
            </div>
            <div style={{
              flex: 1,
              background: 'rgba(59, 130, 246, 0.1)',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              gap: '0.5rem'
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', animation: 'pulse 1.5s ease-in-out infinite' }}></div>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', animation: 'pulse 1.5s ease-in-out 0.2s infinite' }}></div>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', animation: 'pulse 1.5s ease-in-out 0.4s infinite' }}></div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <footer style={{
        padding: '1.5rem',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(0,0,0,0.3)'
      }}>
        <div style={{
          display: 'flex',
          gap: '1rem',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ask anything... (unlimited messages)"
            disabled={loading}
            style={{
              flex: 1,
              padding: '1rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              color: 'white',
              fontSize: '1rem',
              outline: 'none'
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{
              padding: '1rem 2rem',
              background: loading || !input.trim()
                ? 'rgba(59, 130, 246, 0.3)'
                : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            <Send size={20} />
            Send
          </button>
        </div>
        <div style={{
          textAlign: 'center',
          marginTop: '1rem',
          fontSize: '0.75rem',
          color: '#64748b'
        }}>
          💰 Using your API credits • 🔒 Private • ♾️ Unlimited messages
        </div>
      </footer>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}