/**
 * Vox Actions Manager
 * Handles execution of business actions across different departments
 */

const axios = require('axios');
const { logger } = require('../../../common/config/logger');

/**
 * Execute an action based on intent
 * @param {String} action - Action to execute
 * @param {Object} params - Action parameters
 * @returns {Promise} - Promise resolving to action result
 */
exports.executeAction = async (action, params = {}) => {
  try {
    logger.info(`Executing action: ${action} with params: ${JSON.stringify(params)}`);
    
    const handler = actionHandlers[action];
    
    if (!handler) {
      throw new Error(`No handler found for action: ${action}`);
    }
    
    const result = await handler(params);
    return result;
  } catch (error) {
    logger.error(`Error executing action ${action}: ${error.message}`);
    throw error;
  }
};

/**
 * Map of available action handlers
 */
const actionHandlers = {
  // Inventory actions
  notify_stock_alert: async ({ product, userId }) => {
    logger.info(`📦 Notifying about low stock for product: ${product}`);
    await sendNotification(userId, {
      type: 'alert',
      message: `⚠️ Estoque baixo detectado para: ${product}`,
      priority: 'high'
    });
    return { success: true, message: `Alerta de estoque enviado para o produto: ${product}` };
  },
  
  restock_product: async ({ product, quantity = 10 }) => {
    logger.info(`🛒 Iniciando reabastecimento automático para: ${product}`);
    const result = await callServiceAPI('inventory', 'restock', { 
      product, 
      quantity, 
      triggeredBy: 'vox' 
    });
    return { success: true, message: `Reabastecimento solicitado para: ${product}`, details: result };
  },
  
  check_inventory: async ({ product }) => {
    logger.info(`🔍 Verificando níveis de estoque para: ${product}`);
    const result = await callServiceAPI('inventory', 'check', { product });
    return { success: true, inventory: result };
  },
  
  // Financial actions
  approve_expense: async ({ amount, description, requestedBy }) => {
    logger.info(`💰 Aprovando despesa de ${amount} para: ${description}`);
    const result = await callServiceAPI('finance', 'approve-expense', { 
      amount, 
      description, 
      requestedBy 
    });
    return { success: true, message: `Despesa aprovada: ${description}`, details: result };
  },
  
  generate_financial_report: async ({ type = 'monthly', userId }) => {
    logger.info(`📊 Gerando relatório financeiro do tipo: ${type}`);
    const result = await callServiceAPI('finance', 'reports', { type, userId });
    return { success: true, report: result };
  },
  
  // HR actions
  assign_task: async ({ task, assignee, department, priority = 'medium' }) => {
    logger.info(`📋 Atribuindo tarefa para: ${assignee || department}`);
    const target = assignee ? { assignee } : { department };
    const result = await callServiceAPI('tasks', 'assign', { 
      ...target,
      task,
      priority,
      assignedBy: 'vox'
    });
    return { success: true, message: `Tarefa atribuída com sucesso`, taskId: result.taskId };
  },
  
  update_schedule: async ({ userId, event, startTime, endTime }) => {
    logger.info(`📅 Atualizando agenda para: ${userId}`);
    const result = await callServiceAPI('calendar', 'update', { 
      userId, 
      event, 
      startTime, 
      endTime 
    });
    return { success: true, message: `Agenda atualizada`, eventId: result.eventId };
  },
  
  // Sales actions
  fetch_best_sellers: async ({ period = 'week', limit = 5 }) => {
    logger.info(`🏆 Buscando produtos mais vendidos do período: ${period}`);
    const result = await callServiceAPI('sales', 'best-sellers', { period, limit });
    return { success: true, products: result.products };
  },
  
  create_discount: async ({ product, percentage, validUntil }) => {
    logger.info(`🏷️ Criando desconto de ${percentage}% para: ${product}`);
    const result = await callServiceAPI('sales', 'create-discount', { 
      product, 
      percentage, 
      validUntil 
    });
    return { success: true, message: `Desconto criado`, discountId: result.discountId };
  },
  
  // Security actions
  monitor_access_control: async ({ userId }) => {
    logger.info(`🔐 Monitorando controle de acesso para: ${userId || 'todos usuários'}`);
    const result = await callServiceAPI('security', 'access-monitor', { userId });
    return { success: true, accessLogs: result.logs };
  },
  
  update_user_access: async ({ userId, access, granted }) => {
    logger.info(`🔑 ${granted ? 'Concedendo' : 'Revogando'} acesso ${access} para: ${userId}`);
    const result = await callServiceAPI('security', 'update-access', { 
      userId, 
      access, 
      granted 
    });
    return { success: true, message: `Acesso ${granted ? 'concedido' : 'revogado'}` };
  }
};

/**
 * Send a notification to a user
 * @param {String} userId - User ID to notify
 * @param {Object} notification - Notification details
 * @returns {Promise} - Promise resolving to notification result
 */
async function sendNotification(userId, notification) {
  try {
    const result = await axios.post(`${process.env.API_BASE_URL || 'http://localhost:3030/api'}/notifications`, {
      userId,
      ...notification
    });
    return result.data;
  } catch (error) {
    logger.error(`Error sending notification: ${error.message}`);
    throw error;
  }
}

/**
 * Call a service API endpoint
 * @param {String} service - Service name
 * @param {String} endpoint - API endpoint
 * @param {Object} data - Request data
 * @returns {Promise} - Promise resolving to API result
 */
async function callServiceAPI(service, endpoint, data) {
  try {
    const result = await axios.post(
      `${process.env.API_BASE_URL || 'http://localhost:3030/api'}/${service}/${endpoint}`, 
      data
    );
    return result.data;
  } catch (error) {
    logger.error(`Error calling ${service}/${endpoint}: ${error.message}`);
    throw error;
  }
}
