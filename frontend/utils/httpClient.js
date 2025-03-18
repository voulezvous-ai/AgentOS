/**
 * Cliente HTTP centralizado para fazer requisições à API
 * Implementa interceptors para tratamento de erros, autenticação, etc.
 */

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

// Obtém o token de autenticação do armazenamento local
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Adiciona headers de autenticação quando necessário
const getHeaders = (customHeaders = {}) => {
  const headers = { ...DEFAULT_HEADERS, ...customHeaders };
  
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Verifica se a resposta da API é válida
const checkResponse = async (response) => {
  if (!response.ok) {
    // Para respostas de erro, tenta extrair a mensagem da API
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || `Error: ${response.status} ${response.statusText}`);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }
  
  return response;
};

// Métodos de requisição HTTP
const httpClient = {
  // GET request
  async get(url, customHeaders = {}) {
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(customHeaders),
    });
    
    await checkResponse(response);
    return response.json();
  },
  
  // POST request com corpo JSON
  async post(url, data = {}, customHeaders = {}) {
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(customHeaders),
      body: JSON.stringify(data),
    });
    
    await checkResponse(response);
    return response.json();
  },
  
  // PUT request
  async put(url, data = {}, customHeaders = {}) {
    const response = await fetch(url, {
      method: 'PUT',
      headers: getHeaders(customHeaders),
      body: JSON.stringify(data),
    });
    
    await checkResponse(response);
    return response.json();
  },
  
  // DELETE request
  async delete(url, customHeaders = {}) {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders(customHeaders),
    });
    
    await checkResponse(response);
    return response.json();
  },
  
  // POST com FormData (para upload de arquivos)
  async postFormData(url, formData, customHeaders = {}) {
    // Não incluir Content-Type ao enviar FormData
    const headers = { ...customHeaders };
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    await checkResponse(response);
    return response.json();
  },
};

export default httpClient;
