/**
 * @fileoverview API Service wrapper using native fetch
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Custom request wrapper supporting authorization headers
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // Attach session token if logged in
  const token = localStorage.getItem('codepulse_session_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP error! status: ${response.status}`);
  }

  return data;
}

/**
 * Triggers static analysis and code review
 * @param {string} code - Source code
 * @param {string} language - Target language
 * @param {string} userInput - Optional sample input for execution
 */
export async function analyzeCode(code, language, userInput = '') {
  return request('/api/analyze', {
    method: 'POST',
    body: JSON.stringify({ code, language, userInput })
  });
}

/**
 * Gets paginated analysis history logs
 */
export async function getHistory(page = 1, limit = 20) {
  return request(`/api/history?page=${page}&limit=${limit}`);
}

/**
 * Gets full analysis by UUID
 */
export async function getAnalysis(id) {
  return request(`/api/history/${id}`);
}

/**
 * Deletes analysis by UUID
 */
export async function deleteAnalysis(id) {
  return request(`/api/history/${id}`, {
    method: 'DELETE'
  });
}

/**
 * Server health check
 */
export async function healthCheck() {
  return request('/api/health');
}
