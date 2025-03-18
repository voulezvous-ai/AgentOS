/**
 * Configuração central dos endpoints da API
 * Facilita a manutenção e alteração de URLs da API em um único local
 */

const API_BASE_URL = process.env.API_BASE_URL || '';

export const API_ENDPOINTS = {
  // VOX Service endpoints
  VOX: {
    TEXT: `${API_BASE_URL}/api/vox/text`,
    VOICE: `${API_BASE_URL}/api/vox/voice`,
    HISTORY: `${API_BASE_URL}/api/vox/history`,
  },
  
  // WhatsApp Service endpoints
  WHATSAPP: {
    MESSAGES: `${API_BASE_URL}/api/whatsapp/messages`,
    SEND: `${API_BASE_URL}/api/whatsapp/send`,
    CONTACTS: `${API_BASE_URL}/api/whatsapp/contacts`,
  },
  
  // RFID Service endpoints
  RFID: {
    DEVICES: `${API_BASE_URL}/api/rfid/devices`,
    LOGS: `${API_BASE_URL}/api/rfid/logs`,
    REGISTER: `${API_BASE_URL}/api/rfid/register`,
  },
  
  // User management endpoints
  USERS: {
    AUTH: `${API_BASE_URL}/api/users/auth`,
    PROFILE: `${API_BASE_URL}/api/users/profile`,
    REGISTER: `${API_BASE_URL}/api/users/register`,
  },
};

export default API_ENDPOINTS;
