/**
 * Modelo de dados para mensagens de chat no MongoDB
 * Otimizado para Change Streams e operações em tempo real
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Schema para mensagens de chat
 * Projetado para eficiência com Change Streams e consultas frequentes
 */
const MessageSchema = new Schema({
  // Metadados da mensagem
  channel: {
    type: String,
    required: true,
    enum: ['vox', 'couriers', 'support', 'default'],
    index: true,
    description: 'Canal de comunicação da mensagem'
  },
  
  // ID de conversa (facilita agrupamento)
  conversationId: {
    type: String,
    index: true,
    description: 'Identificador único de conversa para agrupar mensagens relacionadas'
  },
  
  // Informações do remetente
  sender: {
    type: String,
    required: true,
    index: true,
    description: 'ID do usuário remetente'
  },
  
  // Nome de exibição do remetente
  senderName: {
    type: String,
    description: 'Nome de exibição do remetente'
  },
  
  // Tipo de remetente (usuário, sistema, bot)
  senderType: {
    type: String,
    required: true,
    enum: ['user', 'system', 'ai'],
    default: 'user',
    description: 'Tipo de entidade que enviou a mensagem'
  },
  
  // Informações do destinatário (se aplicável)
  recipient: {
    type: String,
    index: true,
    sparse: true,
    description: 'ID do usuário destinatário para mensagens diretas'
  },
  
  // Conteúdo da mensagem
  content: {
    type: String,
    required: true,
    description: 'Conteúdo da mensagem'
  },
  
  // Tipo de conteúdo
  contentType: {
    type: String,
    required: true,
    enum: ['text', 'image', 'file', 'location', 'action'],
    default: 'text',
    description: 'Tipo de conteúdo da mensagem'
  },
  
  // Estado de leitura
  readStatus: {
    isRead: {
      type: Boolean,
      default: false,
      description: 'Indica se a mensagem foi lida pelo destinatário'
    },
    readAt: {
      type: Date,
      description: 'Data e hora em que a mensagem foi lida'
    }
  },
  
  // Metadados adicionais (formato livre)
  metadata: {
    type: Object,
    default: {},
    description: 'Dados adicionais específicos por tipo de mensagem'
  }
}, {
  timestamps: true,
  
  // Índices compostos para consultas frequentes
  indexes: [
    // Índice para conversas
    { channel: 1, createdAt: -1 },
    
    // Índice para mensagens não lidas
    { recipient: 1, 'readStatus.isRead': 1 },
    
    // Índice para mensagens diretas
    { sender: 1, recipient: 1, createdAt: -1 },
    
    // Índice para change streams
    { channel: 1, updatedAt: -1 }
  ]
});

/**
 * Formata a mensagem para o cliente
 * @returns {Object} Objeto formatado para o cliente
 */
MessageSchema.methods.toClientJSON = function() {
  return {
    id: this._id,
    channel: this.channel,
    conversationId: this.conversationId,
    sender: this.sender,
    senderName: this.senderName,
    senderType: this.senderType,
    recipient: this.recipient,
    content: this.content,
    contentType: this.contentType,
    readStatus: this.readStatus,
    metadata: this.metadata,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

/**
 * Busca histórico de conversa para um canal específico
 * @param {string} channel - Canal de comunicação
 * @param {number} limit - Limite de resultados
 * @param {number} skip - Número de documentos para ignorar (para paginação)
 * @returns {Promise<Array>} Lista de mensagens
 */
MessageSchema.statics.getConversationHistory = async function(channel, limit = 50, skip = 0) {
  return this.find({ channel })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();
};

/**
 * Busca mensagens diretas entre dois usuários específicos
 * @param {string} sender - ID do remetente
 * @param {string} recipient - ID do destinatário
 * @param {number} limit - Limite de resultados
 * @param {number} skip - Número de documentos para ignorar (para paginação)
 * @returns {Promise<Array>} Lista de mensagens
 */
MessageSchema.statics.getDirectMessages = async function(sender, recipient, limit = 50, skip = 0) {
  return this.find({
    $or: [
      { sender, recipient },
      { sender: recipient, recipient: sender }
    ]
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec();
};

/**
 * Marca mensagens como lidas
 * @param {string} recipient - ID do destinatário
 * @param {string} sender - ID do remetente (opcional)
 * @returns {Promise<Object>} Resultado da atualização
 */
MessageSchema.statics.markAsRead = async function(recipient, sender = null) {
  const query = { recipient, 'readStatus.isRead': false };
  
  // Se o remetente for especificado, restringir às mensagens desse remetente
  if (sender) {
    query.sender = sender;
  }
  
  const result = await this.updateMany(
    query,
    { 
      $set: { 
        'readStatus.isRead': true,
        'readStatus.readAt': new Date()
      } 
    }
  );
  
  return { 
    success: true, 
    modifiedCount: result.nModified || 0 
  };
};

/**
 * Busca mensagens não lidas para um destinatário
 * @param {string} recipient - ID do destinatário
 * @returns {Promise<Array>} Lista de mensagens não lidas
 */
MessageSchema.statics.getUnreadMessages = async function(recipient) {
  return this.find({
    recipient,
    'readStatus.isRead': false
  })
    .sort({ createdAt: -1 })
    .exec();
};

module.exports = mongoose.model('Message', MessageSchema);
