/**
 * Vox Escalation Manager
 * Handles escalation of actions that Vox cannot execute automatically
 */

const axios = require('axios');
const { logger } = require('../../../common/config/logger');

/**
 * Escalate an action to the appropriate authority
 * @param {Object} escalation - Escalation details
 * @param {String} escalation.intent - Action intent
 * @param {String} escalation.userId - Requesting user ID
 * @param {String} escalation.department - Relevant department
 * @param {String} escalation.escalateTo - Role to escalate to (admin, manager, etc)
 * @param {Object} escalation.data - Additional data for the action
 * @returns {Promise<Object>} - Promise resolving to escalation result
 */
exports.escalateAction = async ({ intent, userId, department, escalateTo, data = {} }) => {
  try {
    logger.info(`Escalating action "${intent}" from user ${userId} to ${escalateTo}`);
    
    // Create escalation record
    const escalationRecord = await createEscalationRecord({
      intent,
      userId,
      department,
      escalateTo,
      data
    });
    
    // Send notification to the appropriate authority
    await notifyAuthority({
      intent,
      userId,
      department,
      escalateTo,
      escalationId: escalationRecord.id
    });
    
    return {
      success: true,
      message: `Ação "${intent}" foi encaminhada para aprovação de ${getEscalationTarget(escalateTo)}`,
      escalationId: escalationRecord.id
    };
  } catch (error) {
    logger.error(`Error escalating action: ${error.message}`);
    throw error;
  }
};

/**
 * Get status of an escalated action
 * @param {String} escalationId - Escalation ID
 * @returns {Promise<Object>} - Promise resolving to escalation status
 */
exports.getEscalationStatus = async (escalationId) => {
  try {
    logger.info(`Checking status of escalation ${escalationId}`);
    
    // This would normally query a database
    // For now, we'll simulate a status check
    const status = await simulateStatusCheck(escalationId);
    
    return {
      success: true,
      escalationId,
      status: status.status,
      approvedBy: status.approvedBy,
      timestamp: status.timestamp,
      message: getStatusMessage(status.status)
    };
  } catch (error) {
    logger.error(`Error getting escalation status: ${error.message}`);
    throw error;
  }
};

/**
 * Create an escalation record in the database
 * @param {Object} escalation - Escalation details
 * @returns {Promise<Object>} - Promise resolving to created record
 */
async function createEscalationRecord(escalation) {
  try {
    // This would normally create a record in a database
    // For now, we'll simulate record creation
    const id = `esc_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    logger.info(`Created escalation record ${id}`);
    
    return {
      id,
      ...escalation,
      status: 'pending',
      createdAt: new Date()
    };
  } catch (error) {
    logger.error(`Error creating escalation record: ${error.message}`);
    throw error;
  }
}

/**
 * Notify the appropriate authority about an escalation
 * @param {Object} notification - Notification details
 * @returns {Promise<Object>} - Promise resolving to notification result
 */
async function notifyAuthority({ intent, userId, department, escalateTo, escalationId }) {
  try {
    // Determine who needs to be notified
    const recipientId = await getRecipientId(escalateTo, department);
    
    // Send the notification
    const response = await axios.post(
      `${process.env.API_BASE_URL || 'http://localhost:3030/api'}/notifications`,
      {
        userId: recipientId,
        type: 'escalation',
        priority: getEscalationPriority(intent),
        message: `Aprovação necessária: "${getIntentDescription(intent)}" solicitado por ${userId}.`,
        actionUrl: `/dashboard/approvals/${escalationId}`,
        metadata: {
          escalationId,
          intent,
          requestedBy: userId,
          department
        }
      }
    );
    
    logger.info(`Notification sent to ${recipientId} for escalation ${escalationId}`);
    
    return response.data;
  } catch (error) {
    logger.error(`Error notifying authority: ${error.message}`);
    throw error;
  }
}

/**
 * Get the recipient ID for an escalation
 * @param {String} escalateTo - Role to escalate to
 * @param {String} department - Relevant department
 * @returns {Promise<String>} - Promise resolving to recipient ID
 */
async function getRecipientId(escalateTo, department) {
  // This would normally query a database to find the right person
  // For now, we'll return mock IDs
  if (escalateTo === 'admin') {
    return 'admin_user';
  }
  
  if (department) {
    return `${department}_manager`;
  }
  
  return 'operations_manager'; // Default fallback
}

/**
 * Simulate checking the status of an escalation
 * @param {String} escalationId - Escalation ID
 * @returns {Promise<Object>} - Promise resolving to status object
 */
async function simulateStatusCheck(escalationId) {
  // This would normally query a database
  // For now, we'll return a random status
  const statuses = ['pending', 'approved', 'rejected'];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
  
  return {
    status: randomStatus,
    approvedBy: randomStatus === 'pending' ? null : 'admin_user',
    timestamp: new Date()
  };
}

/**
 * Get a human-readable escalation target
 * @param {String} escalateTo - Role to escalate to
 * @returns {String} - Human-readable target
 */
function getEscalationTarget(escalateTo) {
  const targets = {
    admin: 'um administrador',
    finance_manager: 'gerente financeiro',
    sales_manager: 'gerente de vendas',
    hr_manager: 'gerente de RH',
    inventory_manager: 'gerente de estoque',
    operations_manager: 'gerente de operações',
    security_manager: 'gerente de segurança'
  };
  
  return targets[escalateTo] || 'um responsável';
}

/**
 * Get a human-readable status message
 * @param {String} status - Status code
 * @returns {String} - Human-readable message
 */
function getStatusMessage(status) {
  const messages = {
    pending: 'Aguardando aprovação',
    approved: 'Aprovado',
    rejected: 'Rejeitado'
  };
  
  return messages[status] || 'Status desconhecido';
}

/**
 * Get priority level for an escalation
 * @param {String} intent - Action intent
 * @returns {String} - Priority level (low, medium, high, urgent)
 */
function getEscalationPriority(intent) {
  const urgentIntents = ['approve_large_payment', 'notify_stock_alert'];
  const highIntents = ['terminate_contract', 'approve_expense'];
  const mediumIntents = ['restock_product', 'create_discount'];
  
  if (urgentIntents.includes(intent)) return 'urgent';
  if (highIntents.includes(intent)) return 'high';
  if (mediumIntents.includes(intent)) return 'medium';
  
  return 'low';
}

/**
 * Get a human-readable description of an intent
 * @param {String} intent - Action intent
 * @returns {String} - Human-readable description
 */
function getIntentDescription(intent) {
  const descriptions = {
    approve_large_payment: 'Aprovação de pagamento de alto valor',
    hire_employee: 'Contratação de funcionário',
    terminate_contract: 'Encerramento de contrato',
    approve_expense: 'Aprovação de despesa',
    restock_product: 'Reabastecimento de produto',
    create_discount: 'Criação de desconto',
    update_user_access: 'Atualização de acesso de usuário'
  };
  
  return descriptions[intent] || intent.replace(/_/g, ' ');
}
