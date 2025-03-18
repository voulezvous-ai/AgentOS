/**
 * Serviço para comunicação com a API do Vox
 */

// Obter o ID do usuário autenticado - isso deve vir de um contexto de autenticação em uma aplicação real
const getUserId = () => {
  // Em uma implementação real, pegaria o ID do usuário do contexto de autenticação
  return localStorage.getItem('userId') || 'anonymous-user';
};

/**
 * Envia uma mensagem de texto para a API do VOX
 * @param {string} message - Mensagem a ser enviada
 * @returns {Promise} Resposta da API
 */
export const sendTextMessage = async (message) => {
  try {
    const response = await fetch('/api/vox/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: message,
        userId: getUserId()
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erro na comunicação com o serviço VOX');
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao enviar mensagem para o VOX:', error);
    throw error;
  }
};

/**
 * Envia um arquivo de áudio para o serviço de reconhecimento de voz do VOX
 * @param {File} audioFile - Arquivo de áudio a ser enviado
 * @returns {Promise} Resposta da API com a transcrição
 */
export const sendVoiceMessage = async (audioFile) => {
  try {
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('userId', getUserId());
    
    const response = await fetch('/api/vox/voice', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erro no processamento de voz');
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao processar áudio:', error);
    throw error;
  }
};

/**
 * Obtém o histórico de conversas com o VOX
 * @param {number} limit - Limite de mensagens a retornar
 * @returns {Promise} Lista de mensagens
 */
export const getChatHistory = async (limit = 50) => {
  try {
    const response = await fetch(`/api/vox/history?userId=${getUserId()}&limit=${limit}`);
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao obter histórico de conversas');
    }
    
    return data.messages || [];
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    throw error;
  }
};

export default {
  sendTextMessage,
  sendVoiceMessage,
  getChatHistory
};
