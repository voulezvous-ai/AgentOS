/**
 * Vox Permissions Manager
 * Handles permission checks for Vox actions across different departments
 */

const { logger } = require('../../../common/config/logger');

// Action criticality levels
const CRITICALITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Actions categorized by criticality
const ACTIONS = {
  // Low criticality - Vox can execute automatically
  [CRITICALITY.LOW]: [
    'notify_stock_alert',
    'generate_report',
    'fetch_best_sellers',
    'send_notification',
    'check_status',
    'view_schedule'
  ],
  
  // Medium criticality - Requires specific user permissions
  [CRITICALITY.MEDIUM]: [
    'restock_product',
    'assign_task',
    'update_schedule',
    'create_event',
    'reschedule_meeting'
  ],
  
  // High criticality - Requires department manager approval
  [CRITICALITY.HIGH]: [
    'approve_expense',
    'change_price',
    'create_discount',
    'update_user_access'
  ],
  
  // Critical actions - Requires admin approval
  [CRITICALITY.CRITICAL]: [
    'approve_large_payment',
    'hire_employee',
    'terminate_contract',
    'change_system_settings'
  ]
};

// Department mapping for action routing
const DEPARTMENTS = {
  inventory: ['notify_stock_alert', 'restock_product', 'check_inventory'],
  finance: ['approve_expense', 'approve_large_payment', 'generate_financial_report'],
  hr: ['hire_employee', 'terminate_contract', 'update_schedule'],
  sales: ['fetch_best_sellers', 'change_price', 'create_discount'],
  security: ['update_user_access', 'monitor_access_control', 'change_system_settings'],
  operations: ['assign_task', 'create_event', 'reschedule_meeting']
};

/**
 * Check if Vox can execute an action automatically or needs permission
 * @param {String} action - The action to check
 * @param {Array} userPermissions - User's permissions
 * @returns {Object} - Decision object with allowed status and reason
 */
exports.canVoxExecute = (action, userPermissions = []) => {
  // Check if action is in low criticality (auto-allowed)
  if (ACTIONS[CRITICALITY.LOW].includes(action)) {
    return { 
      allowed: true, 
      reason: "Ação de baixa criticidade que pode ser executada automaticamente.",
      criticality: CRITICALITY.LOW
    };
  }
  
  // Check if user has explicit permission
  if (userPermissions.includes(action)) {
    return { 
      allowed: true, 
      reason: "Usuário tem permissão explícita para essa ação.",
      criticality: getActionCriticality(action)
    };
  }
  
  // Check criticality level for unauthorized actions
  if (ACTIONS[CRITICALITY.CRITICAL].includes(action)) {
    return { 
      allowed: false, 
      reason: "Ação crítica que requer aprovação de administrador.",
      criticality: CRITICALITY.CRITICAL,
      escalateTo: 'admin'
    };
  }
  
  if (ACTIONS[CRITICALITY.HIGH].includes(action)) {
    return { 
      allowed: false, 
      reason: "Ação de alta criticidade que requer aprovação gerencial.",
      criticality: CRITICALITY.HIGH,
      escalateTo: getDepartmentManager(action)
    };
  }
  
  if (ACTIONS[CRITICALITY.MEDIUM].includes(action)) {
    return { 
      allowed: false, 
      reason: "Ação que requer permissão específica.",
      criticality: CRITICALITY.MEDIUM,
      escalateTo: getDepartmentManager(action)
    };
  }
  
  // Default case for undefined actions
  return { 
    allowed: false, 
    reason: "Ação desconhecida ou não categorizada.",
    criticality: "unknown",
    escalateTo: 'admin'
  };
};

/**
 * Get user permissions from the database
 * @param {String} userId - User ID
 * @returns {Promise<Array>} - Promise resolving to array of permissions
 */
exports.getUserPermissions = async (userId) => {
  try {
    // In real implementation, this would query a database
    // For now, we'll return mock permissions based on userId pattern
    
    if (userId.includes('admin')) {
      return [
        ...ACTIONS[CRITICALITY.LOW],
        ...ACTIONS[CRITICALITY.MEDIUM],
        ...ACTIONS[CRITICALITY.HIGH]
      ];
    }
    
    if (userId.includes('manager')) {
      return [
        ...ACTIONS[CRITICALITY.LOW],
        ...ACTIONS[CRITICALITY.MEDIUM]
      ];
    }
    
    // Regular users only get low criticality actions
    return [...ACTIONS[CRITICALITY.LOW]];
    
  } catch (error) {
    logger.error(`Error getting user permissions: ${error.message}`);
    return [];
  }
};

/**
 * Get the criticality level of an action
 * @param {String} action - The action to check
 * @returns {String} - Criticality level
 */
function getActionCriticality(action) {
  for (const [criticality, actions] of Object.entries(ACTIONS)) {
    if (actions.includes(action)) {
      return criticality;
    }
  }
  return "unknown";
}

/**
 * Get the appropriate department manager for an action
 * @param {String} action - The action to check
 * @returns {String} - Department name
 */
function getDepartmentManager(action) {
  for (const [department, actions] of Object.entries(DEPARTMENTS)) {
    if (actions.includes(action)) {
      return `${department}_manager`;
    }
  }
  return 'operations_manager'; // Default fallback
}
