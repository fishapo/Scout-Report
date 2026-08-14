(function (window) {
  const STORAGE_KEY = 'scout-report-auth';
  const state = { token: null, user: null };

  function loadFromStorage() {
    if (typeof sessionStorage === 'undefined') return;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const stored = JSON.parse(raw);
      state.token = stored?.token || null;
      state.user = stored?.user || null;
    } catch (_err) {
      clearState();
    }
  }

  function saveToStorage() {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token: state.token, user: state.user }));
  }

  function clearState() {
    state.token = null;
    state.user = null;
    if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(STORAGE_KEY);
  }

  function getAuthHeaders() {
    return state.token ? { Authorization: `Bearer ${state.token}` } : {};
  }

  function createError(message, status) {
    const error = new Error(message);
    error.status = status || 400;
    return error;
  }

  async function parseJsonSafe(response) {
    try { return response && typeof response.json === 'function' ? await response.json() : null; }
    catch (_err) { return null; }
  }

  function redirectTo(path) {
    if (typeof window !== 'undefined' && window.location) window.location.href = path;
  }

  function redirectToLogin() { redirectTo('/login'); }

  async function loadMe(useBearer = true) {
    const res = await fetch('/auth/me', {
      credentials: 'include',
      headers: useBearer ? getAuthHeaders() : {},
    });
    if (res.status === 401) {
      clearState();
      throw createError('Unauthorized', 401);
    }
    if (!res.ok) {
      const body = await parseJsonSafe(res);
      throw createError(body?.error || 'Failed to load authenticated user', res.status || 400);
    }
    const result = await res.json();
    state.user = result.user;
    saveToStorage();
    return state.user;
  }

  async function init(options = {}) {
    const redirectOnUnauthenticated = options.redirectOnUnauthenticated !== false;
    const redirectPath = options.redirectTo || options.loginPath || '/login';
    loadFromStorage();

    try {
      // Prefer the saved bearer token. If it is stale/invalid, clear it and
      // retry once using the HttpOnly cookie issued by the server.
      if (state.token) {
        try {
          return await loadMe(true);
        } catch (err) {
          if (err?.status !== 401) throw err;
          clearState();
        }
      }
      return await loadMe(false);
    } catch (err) {
      if (redirectOnUnauthenticated) redirectTo(redirectPath);
      if (err?.status === 401) return null;
      throw err;
    }
  }

  async function authAction(endpoint, body) {
    const res = await fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const result = await parseJsonSafe(res);
      throw createError(result?.error || `Request failed (${res.status})`, res.status);
    }
    const result = await res.json();
    state.token = result.token || null;
    state.user = result.user || null;
    saveToStorage();
    return result;
  }

  async function login(credentials) { return authAction('/auth/login', credentials); }
  async function register(credentials) { return authAction('/auth/register', credentials); }

  async function logout() {
    try {
      const res = await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      if (!res.ok && res.status !== 401) {
        const result = await parseJsonSafe(res);
        throw createError(result?.error || 'Logout failed', res.status || 500);
      }
    } finally {
      clearState();
      redirectToLogin();
    }
  }

  async function fetchWithAuth(input, options = {}) {
    const init = {
      ...options,
      credentials: options.credentials || 'include',
      headers: { ...(options.headers || {}), ...getAuthHeaders() },
    };
    const res = await fetch(input, init);
    if (res.status === 401) {
      clearState();
      redirectToLogin();
      throw createError('Unauthorized', 401);
    }
    return res;
  }

  function getUser() { return state.user; }
  function getToken() { return state.token; }
  function clear() { clearState(); }

  loadFromStorage();
  window.browserAuth = { init, login, register, logout, fetchWithAuth, getUser, getToken, clear };
})(typeof window !== 'undefined' ? window : globalThis);
