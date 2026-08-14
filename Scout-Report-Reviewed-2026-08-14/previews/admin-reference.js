(function (window) {
  'use strict';

  function parseError(body, status) {
    const detail = body && body.error;
    const message = typeof detail === 'string'
      ? detail
      : detail && detail.message
        ? detail.message
        : `Request failed (${status})`;
    const error = new Error(message);
    error.status = status;
    error.code = detail && typeof detail === 'object' ? detail.code : undefined;
    error.dependencyCount = detail && typeof detail === 'object' ? detail.dependencyCount : undefined;
    return error;
  }

  class AdminReferenceClient {
    constructor(auth) {
      this.auth = auth;
    }

    async request(path, options = {}) {
      const response = await this.auth.fetchWithAuth(path, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });

      if (response.status === 204) return null;
      let body = null;
      try { body = await response.json(); } catch (_error) { body = null; }
      if (!response.ok) throw parseError(body, response.status);
      return body && Object.prototype.hasOwnProperty.call(body, 'data') ? body.data : body;
    }

    list(resource) { return this.request(`/api/admin/reference/${resource}`); }
    get(resource, id) { return this.request(`/api/admin/reference/${resource}/${encodeURIComponent(id)}`); }
    create(resource, data) { return this.request(`/api/admin/reference/${resource}`, { method: 'POST', body: JSON.stringify(data) }); }
    update(resource, id, data) { return this.request(`/api/admin/reference/${resource}/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }); }
    remove(resource, id) { return this.request(`/api/admin/reference/${resource}/${encodeURIComponent(id)}`, { method: 'DELETE' }); }

    listVarieties(cropTypeId) { return this.request(`/api/admin/reference/crop-types/${encodeURIComponent(cropTypeId)}/varieties`); }
    getVariety(cropTypeId, id) { return this.request(`/api/admin/reference/crop-types/${encodeURIComponent(cropTypeId)}/varieties/${encodeURIComponent(id)}`); }
    createVariety(cropTypeId, data) { return this.request(`/api/admin/reference/crop-types/${encodeURIComponent(cropTypeId)}/varieties`, { method: 'POST', body: JSON.stringify(data) }); }
    updateVariety(cropTypeId, id, data) { return this.request(`/api/admin/reference/crop-types/${encodeURIComponent(cropTypeId)}/varieties/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }); }
    removeVariety(cropTypeId, id) { return this.request(`/api/admin/reference/crop-types/${encodeURIComponent(cropTypeId)}/varieties/${encodeURIComponent(id)}`, { method: 'DELETE' }); }
  }

  window.AdminReferenceClient = AdminReferenceClient;
})(typeof window !== 'undefined' ? window : globalThis);
