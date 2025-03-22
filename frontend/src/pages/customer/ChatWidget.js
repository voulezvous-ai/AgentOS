import React, { useState, useEffect, useRef } from 'react';
import { courierChatService } from '../../services/webSocketService';

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [chatLog, setChatLog] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const chatLogRef = useRef(null);

  // Efeito para inicializar WebSocket quando o chat é aberto
  useEffect(() => {
    if (open && !isConnected) {
      initializeWebSocket();
    } else if (!open && isConnected) {
      courierChatService.disconnect();
      setIsConnected(false);
    }
    return () => {
      if (isConnected) {
        courierChatService.disconnect();
      }
    };
  }, [open, isConnected]);
  
  // Efeito para rolar para o fim quando novas mensagens chegam
  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [chatLog]);
  
  // Inicializa a conexão WebSocket
  const initializeWebSocket = () => {
    courierChatService.onMessage((data) => {
      if (data.type === 'new_message') {
        // Adiciona mensagem recebida via WebSocket
        setChatLog(prev => [...prev, { 
          sender: data.sender === 'system' ? 'System' : 'Courier', 
          text: data.content 
        }]);
      }
    });
    
    courierChatService.onConnect(() => {
      setIsConnected(true);
      setChatLog(prev => [...prev, { 
        sender: 'System', 
        text: 'Connected to courier chat service' 
      }]);
      
      // Autenticação
      const userId = localStorage.getItem('userId') || 'customer-anonymous';
      courierChatService.send({
        type: 'auth',
        userId: userId
      });
    });
    
    courierChatService.onDisconnect(() => {
      setIsConnected(false);
    });
    
    courierChatService.connect();
  };
  
  const toggleChat = () => setOpen(prev => !prev);

  const sendMessage = async () => {
    if (!prompt.trim()) return;
    const userMsg = prompt.trim();
    setChatLog(prev => [...prev, { sender: 'You', text: userMsg }]);
    setPrompt('');

    // Tenta enviar via WebSocket primeiro
    const messageSent = isConnected && courierChatService.send({
      type: 'courier_message',
      content: userMsg,
      timestamp: new Date().toISOString()
    });
    
    // Fallback para API REST se WebSocket falhar
    if (!messageSent) {
      try {
        const res = await fetch('http://localhost:3000/api/chat/couriers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMsg })
        });
        const data = await res.json();
        setChatLog(prev => [...prev, { 
          sender: 'Courier Service', 
          text: data.response || 'No response' 
        }]);
      } catch (error) {
        setChatLog(prev => [...prev, { 
          sender: 'System', 
          text: 'Error connecting to courier service. Please try again later.' 
        }]);
      }
    }
  };

  return (
    <div className={`chat-widget ${open ? 'open' : ''}`}>
      <button className="chat-toggle" onClick={toggleChat}>
        {open ? 'Close Chat' : 'Chat'}
      </button>
      {open && (
        <div className="chat-content">
          <div className="chat-log" ref={chatLogRef}>
            {chatLog.map((msg, idx) => (
              <div
                key={idx}
                className={`chat-message ${msg.sender === 'You' ? 'user' : 'agent'}`}
              >
                <strong>{msg.sender}:</strong> {msg.text}
              </div>
            ))}
          </div>
          <div className="chat-input-group">
            <input
              type="text"
              placeholder="Type your message..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              disabled={!isConnected}
              className="chat-input"
            />
            <button 
              onClick={sendMessage} 
              disabled={!isConnected}
              className="chat-send-btn"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;