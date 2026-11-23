(function (window) {
  const state = { user: null };
  if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem('scout-report-auth');
  const OFFLINE_USER_KEY = 'scout-report-offline-user';
  function rememberOfflineUser(user) {
    if (typeof localStorage === 'undefined') return;
    if (user) localStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(OFFLINE_USER_KEY);
  }
  function offlineUser() {
    if (typeof localStorage === 'undefined') return null;
    try { return JSON.parse(localStorage.getItem(OFFLINE_USER_KEY) || 'null'); } catch (_error) { return null; }
  }

  function clearState() {
    state.user = null;
    rememberOfflineUser(null);
  }

  function getAuthHeaders() { return {}; }

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

  async function loadMe() {
    const res = await fetch('/auth/me', {
      credentials: 'include',
      headers: {},
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
    rememberOfflineUser(state.user);
    return state.user;
  }

  async function init(options = {}) {
    const redirectOnUnauthenticated = options.redirectOnUnauthenticated !== false;
    const redirectPath = options.redirectTo || options.loginPath || '/login';
    try {
      return await loadMe();
    } catch (err) {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        state.user = offlineUser();
        if (state.user) return state.user;
      }
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
    state.user = result.user || null;
    rememberOfflineUser(state.user);
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
  function getToken() { return null; }
  function clear() { clearState(); }

  window.browserAuth = { init, login, register, logout, fetchWithAuth, getUser, getToken, clear };
})(typeof window !== 'undefined' ? window : globalThis);
