/**
 * Controlador para gerenciar mensagens do WebSocket
 * Suporte a MongoDB Change Streams para notificações em tempo real
 */

const Message = require('../models/Message');

// Armazena os monitores de Change Streams ativos
const changeStreams = {};

/**
 * Salva uma mensagem no banco de dados
 * @param {Object} messageData - Dados da mensagem
 * @returns {Promise<Object>} - Mensagem salva
 */
async function saveMessage(messageData) {
  try {
    const message = new Message({
      channel: messageData.channel || 'default',
      sender: messageData.sender,
      senderType: messageData.senderType || 'user',
      recipient: messageData.recipient,
      content: messageData.content,
      contentType: messageData.contentType || 'text',
      metadata: messageData.metadata || {}
    });

    await message.save();
    return message.toClientJSON();
  } catch (error) {
    console.error('Error saving message:', error);
    throw new Error('Failed to save message');
  }
}

/**
 * Busca histórico de mensagens para um canal específico
 * @param {string} channel - Nome do canal
 * @param {number} limit - Número máximo de mensagens para retornar
 * @returns {Promise<Array>} - Lista de mensagens
 */
async function getChannelHistory(channel, limit = 50) {
  try {
    const messages = await Message.getConversationHistory(channel, limit);
    return messages.map(msg => msg.toClientJSON());
  } catch (error) {
    console.error('Error fetching channel history:', error);
    throw new Error('Failed to fetch channel history');
  }
}

/**
 * Busca mensagens diretas entre dois usuários
 * @param {string} user1 - ID do primeiro usuário
 * @param {string} user2 - ID do segundo usuário
 * @param {number} limit - Número máximo de mensagens para retornar
 * @returns {Promise<Array>} - Lista de mensagens
 */
async function getDirectMessages(user1, user2, limit = 50) {
  try {
    const messages = await Message.getDirectMessages(user1, user2, limit);
    return messages.map(msg => msg.toClientJSON());
  } catch (error) {
    console.error('Error fetching direct messages:', error);
    throw new Error('Failed to fetch direct messages');
  }
}

/**
 * Marca mensagens como lidas
 * @param {string} recipient - ID do destinatário
 * @returns {Promise<Object>} - Resultado da operação
 */
async function markMessagesAsRead(recipient) {
  try {
    const result = await Message.updateMany(
      { recipient, read: false },
      { read: true }
    );
    return { success: true, count: result.nModified };
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw new Error('Failed to mark messages as read');
  }
}

/**
 * Processa uma mensagem recebida via WebSocket
 * @param {Object} data - Dados da mensagem
 * @param {string} userId - ID do usuário remetente
 * @param {Object} ws - Conexão WebSocket
 * @param {Function} broadcast - Função para broadcast
 * @returns {Promise<Object>} - Resultado do processamento
 */
async function processMessage(data, userId, ws, broadcast) {
  try {
    // Transforma a mensagem recebida em formato para salvar
    const messageData = {
      channel: data.channel || (data.type === 'vox_message' ? 'vox' : 'couriers'),
      sender: userId,
      senderType: data.senderType || 'user',
      recipient: data.recipient,
      content: data.content,
      contentType: data.contentType || 'text',
      metadata: data.metadata || {}
    };

    // Salva a mensagem
    const savedMessage = await saveMessage(messageData);

    // Prepara mensagem para broadcast
    const broadcastMessage = {
      ...data,
      id: savedMessage.id,
      timestamp: savedMessage.timestamp
    };

    // Decide para onde enviar a mensagem
    if (data.recipient) {
      // Mensagem direta para um usuário específico
      broadcast(data.recipient, JSON.stringify(broadcastMessage));
    } else {
      // Broadcast para o canal
      broadcast(null, JSON.stringify(broadcastMessage), data.channel || messageData.channel);
    }

    return { success: true, message: savedMessage };
  } catch (error) {
    console.error('Error processing message:', error);
    return { 
      success: false, 
      error: 'Internal server error',
      message: error.message 
    };
  }
}

/**
 * Configura um Change Stream para monitorar alterações em mensagens de um canal específico
 * @param {string} channel - Canal para monitorar
 * @param {Function} notifyCallback - Função de callback para notificar clientes
 * @returns {Object} - Stream configurado
 */
async function setupChangeStream(channel, notifyCallback) {
  // Se já existe um stream para este canal, retorne
  if (changeStreams[channel]) {
    return changeStreams[channel];
  }

  try {
    console.log(`Setting up Change Stream for channel: ${channel}`);
    
    // Pipeline para filtrar apenas mensagens do canal específico
    const pipeline = [
      { $match: { 'fullDocument.channel': channel, operationType: { $in: ['insert', 'update'] } } }
    ];

    // Configuração do Change Stream
    const options = { fullDocument: 'updateLookup' };
    
    // Cria o stream observando o modelo de mensagens
    const changeStream = Message.watch(pipeline, options);
    
    // Armazena o stream para referência futura
    changeStreams[channel] = changeStream;
    
    // Configura o evento para cada mudança
    changeStream.on('change', (change) => {
      console.log(`Change detected in channel ${channel}:`, change.operationType);
      
      // Notifica os clientes conectados sobre a mudança
      if (change.fullDocument) {
        const messageData = change.fullDocument.toClientJSON 
          ? change.fullDocument.toClientJSON() 
          : {
              id: change.fullDocument._id,
              sender: change.fullDocument.sender,
              senderType: change.fullDocument.senderType,
              content: change.fullDocument.content,
              contentType: change.fullDocument.contentType,
              timestamp: change.fullDocument.createdAt,
              metadata: change.fullDocument.metadata
            };
            
        notifyCallback(messageData);
      }
    });
    
    // Configura tratamento de erros
    changeStream.on('error', (error) => {
      console.error(`Error in ChangeStream for channel ${channel}:`, error);
      // Remove a referência ao stream com erro
      delete changeStreams[channel];
    });
    
    console.log(`Change Stream successfully set up for channel: ${channel}`);
    return changeStream;
  } catch (error) {
    console.error(`Failed to set up ChangeStream for channel ${channel}:`, error);
    throw error;
  }
}

/**
 * Fecha um Change Stream específico
 * @param {string} channel - Canal do stream a ser fechado
 */
function closeChangeStream(channel) {
  if (changeStreams[channel]) {
    console.log(`Closing ChangeStream for channel ${channel}`);
    changeStreams[channel].close();
    delete changeStreams[channel];
  }
}

/**
 * Fecha todos os Change Streams ativos
 */
function closeAllChangeStreams() {
  Object.keys(changeStreams).forEach(channel => {
    closeChangeStream(channel);
  });
  console.log('All Change Streams closed');
}

module.exports = {
  saveMessage,
  getChannelHistory,
  getDirectMessages,
  markMessagesAsRead,
  processMessage,
  setupChangeStream,
  closeChangeStream,
  closeAllChangeStreams
};
