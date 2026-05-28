const API_BASE_URL = '/api';

const Api = {
  get token() {
    return localStorage.getItem('token');
  },

  setSession(data) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data));
  },

  clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  async request(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers
    });

    if (response.status === 401 || response.status === 403) {
      this.clearSession();
      window.location.href = '/index.html';
      throw new Error('Sessao expirada. Faca login novamente.');
    }

    const contentType = response.headers.get('content-type');
    const data = contentType && contentType.includes('application/json')
      ? await response.json()
      : null;

    if (!response.ok) {
      const message = data?.message
        || Object.values(data || {})[0]
        || 'Erro na requisicao.';

      throw new Error(message);
    }

    return data;
  },

  get(path) {
    return this.request(path);
  },

  post(path, body) {
    return this.request(path, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  put(path, body) {
    return this.request(path, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },

  delete(path) {
    return this.request(path, {
      method: 'DELETE'
    });
  },

  login(credentials) {
    return this.post('/auth/login', credentials);
  },

  register(payload) {
    return this.post('/auth/register', payload);
  },

  getSubjects() {
    return this.get('/subjects');
  },

  createSubject(payload) {
    return this.post('/subjects', payload);
  },

  updateSubject(id, payload) {
    return this.put(`/subjects/${id}`, payload);
  },

  deleteSubject(id) {
    return this.delete(`/subjects/${id}`);
  },

  getStudyMethods() {
    return this.get('/study-methods');
  },

  startSession(payload) {
    return this.post('/sessions/start', payload);
  },

  finishSession(id, payload) {
    return this.post(`/sessions/${id}/finish`, payload);
  },

  getSessions() {
    return this.get('/sessions');
  }
};