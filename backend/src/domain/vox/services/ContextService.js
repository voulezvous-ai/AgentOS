/**
 * Vox Context Manager
 * Manages conversation context and history for improved interactions
 */

const Memory = require('../models/memory');
const { logger } = require('../../../common/config/logger');

/**
 * Log a user interaction with Vox
 * @param {Object} interaction - Interaction details
 * @param {String} interaction.userId - User ID
 * @param {String} interaction.query - User input
 * @param {Object} interaction.response - Vox response
 * @param {String} interaction.sessionId - Session ID
 * @param {String} interaction.intent - Detected intent
 * @returns {Promise} - Promise resolving to saved interaction
 */
exports.logInteraction = async ({ userId, query, response, sessionId, intent }) => {
  try {
    logger.info(`Logging interaction for user ${userId} with intent: ${intent}`);
    
    const memory = new Memory({
      userId,
      type: 'individual',
      content: {
        prompt: query,
        response: typeof response === 'string' ? response : JSON.stringify(response)
      },
      metadata: {
        source: 'text',
        context: {
          sessionId,
          intent
        }
      },
      importance: getImportance(intent),
      tags: [intent, 'vox-hybrid']
    });
    
    await memory.save();
    logger.info(`Interaction logged for user ${userId}`);
    
    return memory;
  } catch (error) {
    logger.error(`Error logging interaction: ${error.message}`);
    throw error;
  }
};

/**
 * Get recent conversation history for a user
 * @param {String} userId - User ID
 * @param {Number} limit - Maximum number of interactions to retrieve
 * @returns {Promise<Array>} - Promise resolving to array of interactions
 */
exports.getRecentHistory = async (userId, limit = 5) => {
  try {
    logger.info(`Fetching recent history for user ${userId}`);
    
    const history = await Memory.find({ userId })
      .sort({ 'metadata.timestamp': -1 })
      .limit(limit);
    
    return history.map(item => ({
      query: item.content.prompt,
      response: item.content.response,
      intent: item.metadata.context.intent || 'unknown',
      timestamp: item.metadata.timestamp
    }));
  } catch (error) {
    logger.error(`Error fetching history: ${error.message}`);
    return [];
  }
};

/**
 * Search for similar past interactions
 * @param {String} query - User input to find similar interactions
 * @param {String} userId - Optional user ID to filter by
 * @returns {Promise<Array>} - Promise resolving to array of similar interactions
 */
exports.findSimilarInteractions = async (query, userId = null) => {
  try {
    logger.info(`Searching for similar interactions to: "${query.substring(0, 50)}..."`);
    
    const searchCriteria = { $text: { $search: query } };
    
    if (userId) {
      searchCriteria.userId = userId;
    }
    
    const similar = await Memory.find(
      searchCriteria,
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(3);
    
    return similar.map(item => ({
      query: item.content.prompt,
      response: item.content.response,
      intent: item.metadata.context.intent || 'unknown',
      timestamp: item.metadata.timestamp
    }));
  } catch (error) {
    logger.error(`Error finding similar interactions: ${error.message}`);
    return [];
  }
};

/**
 * Build conversation context for improved AI responses
 * @param {String} userId - User ID
 * @param {String} currentQuery - Current user input
 * @returns {Promise<Object>} - Promise resolving to context object
 */
exports.buildConversationContext = async (userId, currentQuery) => {
  try {
    // Get recent history
    const recentHistory = await exports.getRecentHistory(userId, 3);
    
    // Find similar past interactions
    const similarInteractions = await exports.findSimilarInteractions(currentQuery);
    
    // Combine into a unified context
    return {
      recentHistory,
      similarInteractions,
      userContext: await getUserContext(userId)
    };
  } catch (error) {
    logger.error(`Error building conversation context: ${error.message}`);
    return {
      recentHistory: [],
      similarInteractions: [],
      userContext: {}
    };
  }
};

/**
 * Get user-specific context information
 * @param {String} userId - User ID
 * @returns {Promise<Object>} - Promise resolving to user context
 */
async function getUserContext(userId) {
  try {
    // This would normally query a user database or profile service
    // For now, we'll return mock data
    return {
      role: userId.includes('admin') ? 'admin' : 
            userId.includes('manager') ? 'manager' : 'user',
      department: userId.includes('finance') ? 'finance' :
                 userId.includes('sales') ? 'sales' :
                 userId.includes('hr') ? 'hr' : 'general',
      preferences: {
        notifications: true,
        language: 'pt-BR'
      }
    };
  } catch (error) {
    logger.error(`Error getting user context: ${error.message}`);
    return {};
  }
}

/**
 * Determine importance level based on intent
 * @param {String} intent - Detected intent
 * @returns {Number} - Importance level (1-10)
 */
function getImportance(intent) {
  const criticalIntents = [
    'approve_large_payment', 
    'hire_employee', 
    'terminate_contract'
  ];
  
  const highImportanceIntents = [
    'approve_expense', 
    'restock_product', 
    'create_discount'
  ];
  
  const mediumImportanceIntents = [
    'assign_task', 
    'update_schedule', 
    'notify_stock_alert'
  ];
  
  if (criticalIntents.includes(intent)) return 10;
  if (highImportanceIntents.includes(intent)) return 8;
  if (mediumImportanceIntents.includes(intent)) return 6;
  
  return 4; // Default for regular interactions
}
