/**
 * Vox Core
 * Central module that coordinates Vox's intelligent decision making
 */

const { v4: uuidv4 } = require('uuid');
const { logger } = require('../../../common/config/logger');
const openaiHelper = require('./openaiHelper');
const voxPermissions = require('./voxPermissions');
const voxActions = require('./voxActions');
const voxContextManager = require('./voxContextManager');
const voxEscalation = require('./voxEscalation');
const voxAudit = require('./voxAudit');

/**
 * Process a user query and execute appropriate actions
 * @param {Object} params - Processing parameters
 * @param {String} params.query - User input text
 * @param {String} params.userId - User ID
 * @param {String} params.sessionId - Optional session ID
 * @returns {Promise<Object>} - Promise resolving to processing result
 */
exports.processQuery = async ({ query, userId, sessionId = null }) => {
  // Iniciar timer de performance para medir tempo de processamento total
  const processingTimerId = voxAudit.startTimer('PROCESS_QUERY', { userId, sessionId });
  
  try {
    // Generate a session ID if not provided
    if (!sessionId) {
      sessionId = uuidv4();
    }
    
    logger.info(`Processing query for user ${userId}: "${query.substring(0, 50)}..."`);
    
    // Registrar recebimento do comando no sistema de auditoria
    voxAudit.logCommandReceived(userId, 'text', query, { sessionId });
    
    // Build conversation context from history
    const contextTimerId = voxAudit.startTimer('BUILD_CONTEXT', { userId, sessionId });
    const conversationContext = await voxContextManager.buildConversationContext(userId, query);
    voxAudit.endTimer(contextTimerId);
    
    // Analyze intent using AI
    const intentTimerId = voxAudit.startTimer('ANALYZE_INTENT', { userId, sessionId });
    const analysis = await analyzeIntent(query, conversationContext);
    voxAudit.endTimer(intentTimerId);
    
    // Registrar análise de intenção no sistema de auditoria
    voxAudit.logIntentAnalyzed(userId, query, analysis, { sessionId });
    
    // Check if Vox can execute this action
    const permissionsTimerId = voxAudit.startTimer('CHECK_PERMISSIONS', { userId, sessionId });
    const userPermissions = await voxPermissions.getUserPermissions(userId);
    const decision = voxPermissions.canVoxExecute(analysis.intent, userPermissions);
    voxAudit.endTimer(permissionsTimerId);
    
    // Log the interaction in memory manager
    await voxContextManager.logInteraction({
      userId,
      query,
      response: analysis,
      sessionId,
      intent: analysis.intent
    });
    
    // Handle based on permission decision
    let result;
    if (decision.allowed) {
      // Vox can execute this action
      result = await executeAllowedAction(analysis, userId, sessionId, decision);
    } else {
      // Vox needs to escalate this action
      result = await handleEscalation(analysis, userId, decision, sessionId);
      
      // Registrar negação de permissão
      voxAudit.logPermissionDenied(userId, analysis.intent, decision.requiredPermission, {
        userPermissions,
        criticality: decision.criticality,
        sessionId
      });
    }
    
    // Finalizar timer de performance
    const totalTime = voxAudit.endTimer(processingTimerId, { 
      intent: analysis.intent,
      allowed: decision.allowed,
      criticality: decision.criticality
    });
    
    // Registrar conclusão do processamento
    voxAudit.logCommandProcessed(userId, 'text', analysis.intent, result, {
      responseTime: totalTime,
      sessionId
    });
    
    return result;
  } catch (error) {
    logger.error(`Error processing query: ${error.message}`);
    
    // Finalizar timer de performance em caso de erro
    voxAudit.endTimer(processingTimerId, { error: error.message });
    
    // Registrar falha no processamento
    voxAudit.logCommandFailed(userId, 'text', query, error, { sessionId });
    
    throw error;
  }
};

/**
 * Check the status of an escalated action
 * @param {String} escalationId - Escalation ID
 * @returns {Promise<Object>} - Promise resolving to status object
 */
exports.checkEscalationStatus = async (escalationId) => {
  // Iniciar timer de performance para verificação de status
  const statusTimerId = voxAudit.startTimer('CHECK_ESCALATION_STATUS', { escalationId });
  
  try {
    const status = await voxEscalation.getEscalationStatus(escalationId);
    
    // Finalizar timer de performance
    voxAudit.endTimer(statusTimerId, { status: status.status });
    
    // Registrar verificação de status no sistema de auditoria
    voxAudit.logger.info(`Escalation status checked: ${escalationId}`, {
      escalationId,
      status: status.status,
      timestamp: new Date()
    });
    
    return status;
  } catch (error) {
    // Finalizar timer de performance em caso de erro
    voxAudit.endTimer(statusTimerId, { error: error.message });
    
    // Registrar erro no sistema de auditoria
    voxAudit.logger.error(`Error checking escalation status: ${error.message}`, {
      escalationId,
      error: error.message,
      stack: error.stack,
      timestamp: new Date()
    });
    
    throw error;
  }
};

/**
 * Analyze intent of a user query
 * @param {String} query - User input
 * @param {Object} context - Conversation context
 * @returns {Promise<Object>} - Promise resolving to intent analysis
 */
async function analyzeIntent(query, context) {
  try {
    // For production, this would use a more sophisticated NLP approach
    // For now, we'll use a simple keyword matching approach alongside OpenAI
    
    // First pass - simple keyword matching for common intents
    const lowercaseQuery = query.toLowerCase();
    
    // Check for stock-related queries
    if (lowercaseQuery.includes('estoque baixo') || lowercaseQuery.includes('falta')) {
      return {
        intent: 'notify_stock_alert',
        product: extractProduct(query),
        confidence: 0.85,
        message: `Detectei estoque baixo para ${extractProduct(query)}. Vou enviar um alerta.`
      };
    }
    
    // Check for sales-related queries
    if (lowercaseQuery.includes('mais vendido') || lowercaseQuery.includes('best seller')) {
      return {
        intent: 'fetch_best_sellers',
        period: extractTimePeriod(query) || 'week',
        confidence: 0.9,
        message: `Aqui estão os produtos mais vendidos da ${extractTimePeriod(query) || 'semana'}.`
      };
    }
    
    // Para consultas mais complexas, usar OpenAI
    const aiTimerId = voxAudit.startTimer('AI_INTENT_ANALYSIS');
    
    // For more complex queries, use OpenAI
    const prompt = buildIntentAnalysisPrompt(query, context);
    
    // Use OpenAI's chat model for better context understanding
    const messages = [
      { role: 'system', content: 'Você é o Vox, um assistente inteligente que gerencia operações empresariais. Sua tarefa é identificar a intenção do usuário e extrair parâmetros relevantes.' },
      { role: 'user', content: prompt }
    ];
    
    const aiResponse = await openaiHelper.generateChatCompletion(messages, {
      model: 'gpt-3.5-turbo',
      temperature: 0.3
    });
    
    // Registrar uso da API de IA no sistema de auditoria
    const aiTime = voxAudit.endTimer(aiTimerId);
    voxAudit.logAIRequest('OpenAI', 'gpt-3.5-turbo', { prompt, messages }, aiTime, { 
      tokensUsed: aiResponse.usage?.total_tokens || 0 
    });
    
    // Parse the AI response to extract intent and parameters
    return parseAIResponse(aiResponse, query);
  } catch (error) {
    logger.error(`Error analyzing intent: ${error.message}`);
    
    // Fallback to a safe response
    return {
      intent: 'generic_response',
      confidence: 0.3,
      message: 'Não consegui identificar sua intenção. Pode tentar novamente com mais detalhes?'
    };
  }
}

/**
 * Execute an action that Vox is allowed to perform
 * @param {Object} analysis - Intent analysis
 * @param {String} userId - User ID
 * @param {String} sessionId - Session ID
 * @param {Object} decision - Permission decision
 * @returns {Promise<Object>} - Promise resolving to execution result
 */
async function executeAllowedAction(analysis, userId, sessionId, decision) {
  // Iniciar timer de performance para execução de ação
  const actionTimerId = voxAudit.startTimer('EXECUTE_ACTION', { 
    userId, 
    sessionId, 
    intent: analysis.intent,
    criticality: decision.criticality 
  });
  
  try {
    logger.info(`Executing allowed action: ${analysis.intent}`);
    
    // Extract parameters from the analysis
    const actionParams = {
      ...analysis,
      userId,
      sessionId
    };
    
    // Determinar departamento baseado na intenção
    const department = extractDepartment(analysis.intent);
    
    // Execute the action
    const actionResult = await voxActions.executeAction(analysis.intent, actionParams);
    
    // Finalizar timer de performance
    const executionTime = voxAudit.endTimer(actionTimerId, { 
      result: 'success',
      department 
    });
    
    // Registrar execução de ação no sistema de auditoria
    voxAudit.logActionExecuted(userId, analysis.intent, actionParams, actionResult, {
      criticality: decision.criticality,
      department,
      responseTime: executionTime,
      sessionId
    });
    
    // Return a formatted response
    return {
      success: true,
      intent: analysis.intent,
      message: analysis.message,
      result: actionResult,
      sessionId,
      executedBy: 'vox',
      criticality: decision.criticality,
      automated: true,
      executionTime
    };
  } catch (error) {
    logger.error(`Error executing action: ${error.message}`);
    
    // Finalizar timer de performance em caso de erro
    voxAudit.endTimer(actionTimerId, { 
      result: 'failure',
      error: error.message 
    });
    
    // Registrar falha na execução de ação
    voxAudit.logActionFailed(userId, analysis.intent, analysis, error, {
      criticality: decision.criticality,
      department: extractDepartment(analysis.intent),
      sessionId
    });
    
    return {
      success: false,
      intent: analysis.intent,
      message: `Houve um problema ao executar ${analysis.intent}: ${error.message}`,
      sessionId,
      error: error.message
    };
  }
}

/**
 * Handle escalation for actions Vox cannot execute
 * @param {Object} analysis - Intent analysis
 * @param {String} userId - User ID
 * @param {Object} decision - Permission decision
 * @param {String} sessionId - Session ID
 * @returns {Promise<Object>} - Promise resolving to escalation result
 */
async function handleEscalation(analysis, userId, decision, sessionId) {
  // Iniciar timer de performance para escalação
  const escalationTimerId = voxAudit.startTimer('HANDLE_ESCALATION', { 
    userId, 
    sessionId, 
    intent: analysis.intent,
    escalateTo: decision.escalateTo 
  });
  
  try {
    logger.info(`Escalating action: ${analysis.intent} to ${decision.escalateTo}`);
    
    // Extract the department from the intent or analysis
    const department = extractDepartment(analysis.intent);
    
    // Escalate the action
    const escalationResult = await voxEscalation.escalateAction({
      intent: analysis.intent,
      userId,
      department,
      escalateTo: decision.escalateTo,
      data: analysis
    });
    
    // Finalizar timer de performance
    const escalationTime = voxAudit.endTimer(escalationTimerId, { 
      result: 'success',
      department,
      escalationId: escalationResult.escalationId 
    });
    
    // Registrar criação de escalonamento no sistema de auditoria
    voxAudit.logEscalationCreated(userId, analysis.intent, escalationResult.escalationId, decision.escalateTo, {
      department,
      reason: decision.reason,
      criticality: decision.criticality,
      sessionId
    });
    
    // Return a formatted response
    return {
      success: true,
      intent: analysis.intent,
      message: `${decision.reason} ${escalationResult.message}`,
      escalationId: escalationResult.escalationId,
      criticality: decision.criticality,
      automated: false,
      needsApproval: true,
      escalationTime
    };
  } catch (error) {
    logger.error(`Error escalating action: ${error.message}`);
    
    // Finalizar timer de performance em caso de erro
    voxAudit.endTimer(escalationTimerId, { 
      result: 'failure',
      error: error.message 
    });
    
    return {
      success: false,
      intent: analysis.intent,
      message: `Não foi possível encaminhar ${analysis.intent} para aprovação: ${error.message}`,
      error: error.message
    };
  }
}

/**
 * Build a prompt for intent analysis
 * @param {String} query - User input
 * @param {Object} context - Conversation context
 * @returns {String} - Formatted prompt
 */
function buildIntentAnalysisPrompt(query, context) {
  let prompt = `Analise a seguinte consulta do usuário e identifique a intenção e parâmetros relevantes:
  
"${query}"

Possíveis intenções incluem:
- notify_stock_alert: Alerta de estoque baixo para um produto
- restock_product: Solicitação para reabastecer um produto
- fetch_best_sellers: Consulta sobre produtos mais vendidos
- generate_financial_report: Solicitação de relatório financeiro
- approve_expense: Aprovação de despesa
- assign_task: Atribuição de tarefa
- update_schedule: Atualização de agenda
- create_discount: Criação de desconto
- monitor_access_control: Monitoramento de acesso
- update_user_access: Atualização de privilégios de acesso

`;

  // Add recent history if available
  if (context.recentHistory && context.recentHistory.length > 0) {
    prompt += `\nHistórico recente de conversas:`;
    context.recentHistory.forEach((item, index) => {
      prompt += `\n${index + 1}. Usuário: "${item.query}"\n   Vox: "${item.response}"\n`;
    });
  }

  prompt += `\nRetorne sua análise no formato JSON:
{
  "intent": "nome_da_intenção",
  "confidence": 0.0 a 1.0,
  "message": "mensagem de resposta ao usuário",
  ... parâmetros específicos da intenção ...
}`;

  return prompt;
}

/**
 * Parse the AI response to extract intent information
 * @param {String} aiResponse - Raw AI response
 * @param {String} originalQuery - Original user query
 * @returns {Object} - Parsed intent object
 */
function parseAIResponse(aiResponse, originalQuery) {
  try {
    // Try to extract JSON from the response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // If no JSON found, return a generic response
    return {
      intent: 'generic_response',
      confidence: 0.4,
      message: aiResponse,
      originalQuery
    };
  } catch (error) {
    logger.error(`Error parsing AI response: ${error.message}`);
    
    return {
      intent: 'generic_response',
      confidence: 0.3,
      message: aiResponse,
      originalQuery
    };
  }
}

/**
 * Extract product name from a query
 * @param {String} query - User input
 * @returns {String} - Extracted product name
 */
function extractProduct(query) {
  // This would normally use NLP to extract entities
  // For now, we'll use a simple approach
  
  const productWords = ['produto', 'item', 'mercadoria'];
  const words = query.split(' ');
  
  for (let i = 0; i < words.length; i++) {
    if (productWords.includes(words[i].toLowerCase()) && i < words.length - 1) {
      return words[i + 1];
    }
  }
  
  return 'produto não especificado';
}

/**
 * Extract time period from a query
 * @param {String} query - User input
 * @returns {String} - Extracted time period
 */
function extractTimePeriod(query) {
  const lowercaseQuery = query.toLowerCase();
  
  if (lowercaseQuery.includes('dia') || lowercaseQuery.includes('hoje')) {
    return 'day';
  }
  
  if (lowercaseQuery.includes('semana')) {
    return 'week';
  }
  
  if (lowercaseQuery.includes('mês') || lowercaseQuery.includes('mes')) {
    return 'month';
  }
  
  if (lowercaseQuery.includes('ano')) {
    return 'year';
  }
  
  return 'week'; // Default to week
}

/**
 * Extract department from an intent
 * @param {String} intent - Action intent
 * @returns {String} - Department name
 */
function extractDepartment(intent) {
  const departmentMap = {
    notify_stock_alert: 'inventory',
    restock_product: 'inventory',
    fetch_best_sellers: 'sales',
    generate_financial_report: 'finance',
    approve_expense: 'finance',
    assign_task: 'operations',
    update_schedule: 'hr',
    create_discount: 'sales',
    monitor_access_control: 'security',
    update_user_access: 'security'
  };
  
  return departmentMap[intent] || 'operations';
}
