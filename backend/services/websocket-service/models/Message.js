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
    enum: ['vox', 'couriers', 'support'],
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
    default: 'user'
  },
  
  // Destinatário (pode ser null para mensagens de broadcast)
  recipient: {
    type: String,
    index: true
  },
  
  // Conteúdo da mensagem
  content: {
    type: String,
    required: true
  },
  
  // Tipo de conteúdo
  contentType: {
    type: String,
    enum: ['text', 'voice', 'image', 'file', 'system'],
    default: 'text'
  },
  
  // Metadados adicionais (ex: transcrição de voz, dimensões de imagem)
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Controle de status da mensagem
  status: {
    read: {
      type: Boolean,
      default: false,
      description: 'Indica se a mensagem foi lida pelo destinatário'
    },
    delivered: {
      type: Boolean,
      default: true,
      description: 'Indica se a mensagem foi entregue ao destinatário'
    },
    readAt: {
      type: Date,
      description: 'Data e hora em que a mensagem foi lida'
    },
    deliveredAt: {
      type: Date,
      default: Date.now,
      description: 'Data e hora em que a mensagem foi entregue'
    }
  },
  
  // Timestamps automáticos
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
    description: 'Data e hora de criação da mensagem'
  },
  updatedAt: {
    type: Date,
    description: 'Data e hora da última atualização da mensagem'
  },
  
  // Indicadores de status
  deleted: {
    type: Boolean,
    default: false,
    description: 'Indica se a mensagem foi excluída'
  },
  
  // Campo para armazenar a ordem das mensagens em uma conversa
  sequence: {
    type: Number,
    description: 'Número sequencial da mensagem na conversa'
  },
  
  // Campos para monitoramento e rastreamento
  clientMessageId: {
    type: String,
    description: 'ID da mensagem gerado pelo cliente para deduplicação'
  },
  changeStreamVersion: {
    type: Number,
    default: 1,
    description: 'Versão do registro para controle de Change Streams'
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  // Usar collation para pesquisa insensível a maiúsculas e minúsculas
  collation: { locale: 'pt', strength: 2 }
});

// Índices compostos para consultas otimizadas
MessageSchema.index({ channel: 1, createdAt: -1 }, { background: true });
MessageSchema.index({ sender: 1, recipient: 1, createdAt: -1 }, { background: true });
MessageSchema.index({ conversationId: 1, sequence: 1 }, { background: true });
MessageSchema.index({ clientMessageId: 1 }, { unique: true, sparse: true, background: true });
MessageSchema.index({ 'status.delivered': 1, 'status.read': 1 }, { background: true });

/**
 * Método para formatar a mensagem para o cliente
 * @returns {Object} Objeto formatado para envio ao cliente
 */
MessageSchema.methods.toClientJSON = function() {
  return {
    id: this._id,
    clientMessageId: this.clientMessageId,
    conversationId: this.conversationId,
    channel: this.channel,
    sender: this.sender,
    senderName: this.senderName,
    senderType: this.senderType,
    recipient: this.recipient,
    content: this.content,
    contentType: this.contentType,
    timestamp: this.createdAt,
    status: {
      read: this.status?.read || false,
      delivered: this.status?.delivered || false,
      readAt: this.status?.readAt,
      deliveredAt: this.status?.deliveredAt
    },
    metadata: this.metadata,
    sequence: this.sequence,
    deleted: this.deleted
  };
};

/**
 * Método estático para buscar histórico de conversa
 * @param {string} channel - Canal de comunicação
 * @param {number} limit - Limite de resultados
 * @param {number} skip - Número de documentos para ignorar (para paginação)
 * @returns {Promise<Array>} Lista de mensagens
 */
MessageSchema.statics.getConversationHistory = async function(channel, limit = 50, skip = 0) {
  return this.find({ 
    channel,
    deleted: false
  })
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit)
  .exec();
};

/**
 * Método estático para buscar conversas entre usuários específicos
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
    ],
    deleted: false
  })
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit)
  .exec();
};

/**
 * Marcar mensagens como lidas
 * @param {string} recipient - ID do destinatário
 * @param {string} sender - ID do remetente
 * @returns {Promise<Object>} Resultado da atualização
 */
MessageSchema.statics.markAsRead = async function(recipient, sender) {
  const now = new Date();
  const result = await this.updateMany(
    { 
      recipient, 
      sender,
      'status.read': false,
      deleted: false 
    },
    {
      $set: { 
        'status.read': true, 
        'status.readAt': now,
        updatedAt: now,
        changeStreamVersion: { $add: ['$changeStreamVersion', 1] }
      }
    }
  );
  
  return result;
};

/**
 * Buscar mensagens não lidas para um destinatário
 * @param {string} recipient - ID do destinatário
 * @returns {Promise<Array>} Lista de mensagens não lidas
 */
MessageSchema.statics.getUnreadMessages = async function(recipient) {
  return this.find({
    recipient,
    'status.read': false,
    deleted: false
  })
  .sort({ createdAt: -1 })
  .exec();
};

module.exports = mongoose.model('Message', MessageSchema);
