const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.API_BASE_URL ||
  "http://localhost:3000";

/**
 * fetchWrapper - universal fetch utility for API calls
 * @param {string} endpoint - API endpoint (relative or absolute)
 * @param {object} options - fetch options
 * @returns {Promise<Response>}
 */
async function fetchWrapper(endpoint, options = {}) {
  let url = endpoint;
  // If endpoint is relative, prepend base URL
  if (endpoint.startsWith("/")) {
    url = BASE_URL.replace(/\/$/, "") + endpoint;
  }
  return fetch(url, options);
}

module.exports = fetchWrapper;
