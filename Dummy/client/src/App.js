import React, { useState, useEffect } from 'react';
import Vapi from '@vapi-ai/web';

const vapi = new Vapi("f71004a5-4cfe-49f6-a1e1-de500c7b9f75");

function App() {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const assistantId = "332d2014-a377-4efd-9787-3daaca164acf";

  useEffect(() => {
    vapi.on('call-start', () => {
      setConnecting(false);
      setConnected(true);
    });
    vapi.on('call-end', () => {
      setConnecting(false);
      setConnected(false);
    });
  }, []);

  const toggleCall = () => {
    if (connected) {
      vapi.stop();
    } else {
      setConnecting(true);
      vapi.start(assistantId);
    }
  };
  console.log("Public Key:", process.env.REACT_APP_VAPI_PUBLIC_KEY);
  console.log("Assistant ID:", assistantId);
  return (
  <div className="app-container">
    <div className="card">
      <h1 style={{ color: '#1e3a8a', marginBottom: '5px' }}>LokSeva</h1>
      <p style={{ color: '#64748b', fontStyle: 'italic', marginBottom: '30px' }}>
        "Decoding Schemes, Defeating Fraud"
      </p>

      <button 
        onClick={toggleCall}
        className={`vapi-btn ${connected ? 'active' : 'idle'}`}
      >
        {connecting ? "⌛" : connected ? "⏹️" : "🎤"}
      </button>

      <p style={{ marginTop: '20px', fontWeight: '600' }}>
        {connected ? "Jan-Sahayak is Listening..." : "Tap to speak with Jan-Sahayak"}
      </p>
    </div>
  </div>
);
}

export default App;