import React, { useState, useEffect, useRef } from 'react';
import Vapi from '@vapi-ai/web';
import './VapiChatAssistant.css';

// To use this, the user must update their .env with REACT_APP_VAPI_PUBLIC_KEY
// Hardcoded Vapi initialization with Public Key provided by the user
const vapi = new Vapi("f71004a5-4cfe-49f6-a1e1-de500c7b9f75");

const VapiChatAssistant = ({ inline = false, language = 'English', dictionary = {} }) => {
  const [isOpen, setIsOpen] = useState(inline); // Auto-open if inline
  const [isCallActive, setIsCallActive] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // VAPI Event Listeners
    vapi.on('call-start', () => {
      setIsCallActive(true);
      setMessages(prev => [...prev, { role: 'system', content: 'Call connected.' }]);

      // Dynamically read language from UI without destroying the dashboard Assistant configuration
      const activeLanguage = language || 'their spoken language';

      // Send a hidden system message purely to command the active Vapi session's language
      vapi.send({
        type: 'add-message',
        message: {
          role: 'system',
          content: `IMPORTANT: The user has selected ${activeLanguage} as their preferred language. You MUST converse and respond strictly in ${activeLanguage}. Use paragraphs and native typography (e.g., Devanagari for Hindi/Marathi).`
        }
      });
    });

    vapi.on('call-end', () => {
      setIsCallActive(false);
      setMessages(prev => [...prev, { role: 'system', content: 'Call ended.' }]);
    });

    vapi.on('message', (message) => {
      // Handle the final spoken text (both User and VAPI)
      if (message.type === 'transcript' && message.transcriptType === 'final') {
        const msgRole = message.role || 'user';
        
        // Anti-duplication logic
        setMessages(prev => {
          if (prev.length > 0 && prev[prev.length - 1].role === msgRole && prev[prev.length - 1].content === message.transcript) {
            return prev;
          }
          return [...prev, { role: msgRole, content: message.transcript }];
        });
      }
      
      // Handle text-only payloads from the assistant (if any fallback happens)
      if (message.type === 'assistant-message') {
        const textResponse = message.message || message.text;
        if (textResponse) {
          setMessages(prev => {
            // Prevent transcript + assistant-message duplicate mirroring
            if (prev.length > 0 && prev[prev.length - 1].role === 'assistant' && prev[prev.length - 1].content === textResponse) return prev;
            return [...prev, { role: 'assistant', content: textResponse }];
          });
        }
      }
    });

    vapi.on('error', (e) => {
      console.error(e);
      setMessages(prev => [...prev, { role: 'system', content: `Error: ${e.message || 'Unknown error'}` }]);
    });

    return () => {
      vapi.removeAllListeners();
    };
  }, [language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const toggleCall = async () => {
    if (isCallActive) {
      vapi.stop();
    } else {
      setMessages(prev => [...prev, { role: 'system', content: dictionary.vapi_error || 'Connecting (Please allow microphone)...' }]);
      try {
        // Minimal overrides to keep connection stable and avoid destructive model replacement
        const assistantOverrides = {
          transcriber: {
            provider: "deepgram",
            model: "nova-2",
            language: "multi", // Enforces Hindi/Marathi and multi-language comprehension globally
            endpointing: 500
          },
          silenceTimeoutSeconds: 120, // 2 minutes of silence tolerance
          voice: {
            provider: "openai",
            voiceId: "nova" // Enforce natural female AI voice globally
          }
        };
        await vapi.start("332d2014-a377-4efd-9787-3daaca164acf", assistantOverrides);
      } catch (err) {
        console.error("Start Call Error", err);
        setMessages(prev => [...prev, { role: 'system', content: `Error starting call: ${err.message}` }]);
        setIsCallActive(false);
      }
    }
  };

  const handleSendText = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // We can only send message to assistant if call is active in standard Vapi web SDK.
    // If you're doing text-only, you might need a different REST API, but here we assume sending during a call.
    if (isCallActive) {
      vapi.send({
        type: 'add-message',
        message: {
          role: 'user',
          content: inputText
        }
      });
    }

    setMessages(prev => [...prev, { role: 'user', content: inputText, isText: true }]);
    setInputText("");
  };

  return (
    <div className={`vapi-widget-container ${inline ? 'inline' : ''}`}>
      {(isOpen || inline) && (
        <div className={`vapi-chat-window ${inline ? 'inline' : ''}`}>
          <div className="vapi-chat-header">
            <h3>🤖 {inline ? dictionary.ai_assistant : 'KrishiSetu Voice Agent'}</h3>
            {!inline && <button className="close-btn" onClick={() => setIsOpen(false)}>✕</button>}
          </div>
          
          <div className="vapi-chat-messages">
            {messages.length === 0 ? (
              <p className="empty-message">{dictionary.voice_off_msg || 'Turn on Voice to start chatting'}</p>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`vapi-message ${msg.role}`}>
                  <div className="message-wrapper">
                    {msg.role !== 'system' && (
                      <span className="message-sender">
                        {msg.role === 'assistant' ? '🤖 VAPI' : '🧑 You'}
                      </span>
                    )}
                    <div className="message-bubble">{msg.content}</div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="vapi-chat-controls">
            <button 
              className={`voice-btn ${isCallActive ? 'active' : ''}`}
              onClick={toggleCall}
              title={isCallActive ? "End Voice Call" : "Start Voice Call"}
            >
              {isCallActive ? `⏹️ ${dictionary.end_call}` : `🎤 ${dictionary.start_voice}`}
            </button>
            <form onSubmit={handleSendText} className="text-form">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isCallActive ? dictionary.type_here : dictionary.voice_off_msg}
                disabled={!isCallActive}
              />
              <button type="submit" disabled={!isCallActive || !inputText.trim()}>Send</button>
            </form>
          </div>
        </div>
      )}

      {!isOpen && !inline && (
        <button className="vapi-floating-btn" onClick={() => setIsOpen(true)}>
          🤖 {dictionary.ai_assistant}
        </button>
      )}
    </div>
  );
};

export default VapiChatAssistant;
