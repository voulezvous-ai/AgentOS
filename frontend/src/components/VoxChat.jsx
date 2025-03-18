import { useState, useEffect, useRef } from 'react';
import { sendTextMessage } from '../api/voxService';
import { voxWebSocketService } from '../utils/webSocketService';
import '../styles/VoxChat.css';

const VoxChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const chatHistoryRef = useRef(null);
  const recognitionRef = useRef(null);

  // Inicializa o reconhecimento de voz e configura WebSocket
  useEffect(() => {
    // Inicializa com uma mensagem de boas-vindas
    setMessages([
      { 
        sender: 'Vox', 
        message: 'Hello! I am Vox, the central guardian of AgentOS. How can I assist you today?', 
        type: 'vox-message' 
      }
    ]);
    
    // Inicializa conexão WebSocket
    initializeWebSocket();

    // Configuração para reconhecimento de voz
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      
      recognition.addEventListener('result', event => {
        const transcript = event.results[0][0].transcript;
        handleVoiceInput(transcript);
      });
      
      recognition.addEventListener('end', () => {
        setIsRecording(false);
      });
      
      recognition.addEventListener('error', event => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        addMessage('System', `Speech recognition error: ${event.error}`, 'vox-message');
      });

      recognitionRef.current = recognition;
    }

    return () => {
      // Limpeza do reconhecimento de voz ao desmontar o componente
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore erros ao parar reconhecimento
        }
      }
      
      // Desconecta WebSocket ao desmontar o componente
      voxWebSocketService.disconnect();
    };
  }, []);

  // Scroll automaticamente quando novas mensagens são adicionadas
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages]);
  
  /**
   * Inicializa a conexão WebSocket
   */
  const initializeWebSocket = () => {
    // Registra handlers para eventos WebSocket
    voxWebSocketService.onMessage((data) => {
      // Processar mensagens recebidas via WebSocket
      if (data.type === 'vox_response') {
        addMessage('Vox', data.content, 'vox-message');
      } else if (data.type === 'system_message') {
        addMessage('System', data.content, 'system-message');
      }
    });
    
    voxWebSocketService.onConnect(() => {
      console.log('WebSocket conectado');
      // Enviar identificação do usuário (se disponível)
      const userId = localStorage.getItem('userId') || 'anonymous';
      voxWebSocketService.send({
        type: 'auth',
        userId: userId
      });
    });
    
    voxWebSocketService.onDisconnect(() => {
      console.log('WebSocket desconectado');
    });
    
    // Conectar WebSocket
    voxWebSocketService.connect();
  };

  const addMessage = (sender, message, type) => {
    setMessages(prev => [...prev, { sender, message, type }]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    // Adiciona mensagem do usuário ao chat
    addMessage('User', inputValue, 'user-message');
    
    // Tenta enviar via WebSocket primeiro (comunicação em tempo real)
    const messageSent = voxWebSocketService.isConnected() && voxWebSocketService.send({
      type: 'text_message',
      content: inputValue,
      timestamp: new Date().toISOString()
    });
    
    // Se o WebSocket não estiver disponível, usa a API REST como fallback
    if (!messageSent) {
      try {
        // Envia a mensagem para a API usando o serviço
        const data = await sendTextMessage(inputValue);
        
        if (data.success && data.response) {
          addMessage('Vox', data.response, 'vox-message');
        } else {
          addMessage('Vox', 'Sorry, I encountered an error processing your request.', 'vox-message');
        }
      } catch (err) {
        console.error('Error:', err);
        addMessage('Vox', 'Sorry, there was a communication error.', 'vox-message');
      }
    }
    
    // Limpa o campo de entrada
    setInputValue('');
  };

  const handleVoiceInput = async (transcript) => {
    // Adiciona mensagem de voz do usuário ao chat
    addMessage('User (Voice)', transcript, 'user-message');
    
    // Tenta enviar via WebSocket primeiro
    const messageSent = voxWebSocketService.isConnected() && voxWebSocketService.send({
      type: 'voice_message',
      content: transcript,
      timestamp: new Date().toISOString()
    });
    
    // Se o WebSocket não estiver disponível, usa a API REST como fallback
    if (!messageSent) {
      try {
        const data = await sendTextMessage(transcript);
        
        if (data.success && data.response) {
          addMessage('Vox', data.response, 'vox-message');
        } else {
          addMessage('Vox', 'Sorry, I encountered an error processing your request.', 'vox-message');
        }
      } catch (err) {
        console.error('Error:', err);
        addMessage('Vox', 'Sorry, there was a communication error.', 'vox-message');
      }
    }
  };

  const toggleVoiceRecognition = () => {
    if (!recognitionRef.current) {
      addMessage('System', 'Speech Recognition API not supported in this browser.', 'vox-message');
      return;
    }
    
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
    
    setIsRecording(!isRecording);
  };

  return (
    <div className="vox-chat-container">
      <div className="header">
        <h1>Vox Hybrid</h1>
        <p>AgentOS Central Guardian</p>
      </div>
      
      <div className="chat-history" ref={chatHistoryRef}>
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.type}`}>
            <strong>{msg.sender}:</strong> {msg.message}
          </div>
        ))}
      </div>
      
      <div className="chat-input">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type your message here..."
          className="text-input"
        />
        <button onClick={handleSendMessage} className="send-button">
          Send
        </button>
      </div>
      
      <button 
        onClick={toggleVoiceRecognition} 
        className={`voice-button ${isRecording ? 'recording' : ''}`}
        title="Press to speak"
      >
        {isRecording ? '⏹️' : '🎤'}
      </button>
    </div>
  );
};

export default VoxChat;
