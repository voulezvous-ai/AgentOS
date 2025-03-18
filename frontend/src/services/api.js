const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

export async function apiGet(endpoint) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!response.ok) {
    throw new Error(`GET ${endpoint} failed with status ${response.status}`);
  }
  return response.json();
}

export async function apiPost(endpoint, data = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    throw new Error(`POST ${endpoint} failed with status ${response.status}`);
  }
  return response.json();
}

export async function apiPut(endpoint, data = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    throw new Error(`PUT ${endpoint} failed with status ${response.status}`);
  }
  return response.json();
}

export async function apiDelete(endpoint) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!response.ok) {
    throw new Error(`DELETE ${endpoint} failed with status ${response.status}`);
  }
  return response.json();
}