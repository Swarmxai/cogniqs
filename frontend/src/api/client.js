const API_BASE = '/api'

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('cq_token') || ''
  }

  setToken(token) {
    this.token = token
    if (token) localStorage.setItem('cq_token', token)
    else localStorage.removeItem('cq_token')
  }

  async request(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    }
    if (this.token) headers.Authorization = `Bearer ${this.token}`

    const resp = await fetch(`${API_BASE}${path}`, { ...options, headers })
    const data = await resp.json().catch(() => ({}))
    if (!resp.ok) throw new Error(data.message || `Request failed (${resp.status})`)
    return data
  }

  login(email, password) {
    return this.request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
  }

  register(email, password, name) {
    return this.request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) })
  }

  me() {
    return this.request('/auth/me')
  }

  getNodes() {
    return this.request('/nodes')
  }

  getWorkflows() {
    return this.request('/workflows')
  }

  getWorkflow(id) {
    return this.request(`/workflows/${id}`)
  }

  createWorkflow(data) {
    return this.request('/workflows', { method: 'POST', body: JSON.stringify(data) })
  }

  updateWorkflow(id, data) {
    return this.request(`/workflows/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  }

  deleteWorkflow(id) {
    return this.request(`/workflows/${id}`, { method: 'DELETE' })
  }

  executeWorkflow(id, triggerData = {}) {
    return this.request(`/workflows/${id}/execute`, {
      method: 'POST',
      body: JSON.stringify({ trigger_data: triggerData }),
    })
  }

  getExecutions(workflowId) {
    const qs = workflowId != null ? `?workflow_id=${workflowId}` : ''
    return this.request(`/executions${qs}`)
  }

  chat(workflowId, message, sessionId = 'default') {
    return this.request(`/chat/${workflowId}`, {
      method: 'POST',
      body: JSON.stringify({ message, session_id: sessionId }),
    })
  }

  generateWorkflow(description) {
    return this.request('/builder/generate', { method: 'POST', body: JSON.stringify({ description }) })
  }

  getTemplates() {
    return this.request('/templates')
  }

  useTemplate(id) {
    return this.request(`/templates/${id}/use`, { method: 'POST' })
  }

  getCredentials() {
    return this.request('/credentials')
  }

  createCredential(data) {
    return this.request('/credentials', { method: 'POST', body: JSON.stringify(data) })
  }

  deleteCredential(id) {
    return this.request(`/credentials/${id}`, { method: 'DELETE' })
  }

  // ── Datasets ─────────────────────────────────────────────
  getDatasets(folder) {
    const q = folder != null ? `?folder=${encodeURIComponent(folder)}` : ''
    return this.request(`/datasets${q}`)
  }

  uploadDataset(file, name, folder = '') {
    const form = new FormData()
    form.append('file', file)
    form.append('name', name)
    form.append('folder', folder)
    const headers = {}
    if (this.token) headers.Authorization = `Bearer ${this.token}`
    return fetch(`${API_BASE}/datasets/upload`, { method: 'POST', body: form, headers }).then(async (r) => {
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data.message || 'Upload failed')
      return data
    })
  }

  importDatasetUrl(url, name, folder = '') {
    return this.request('/datasets/import-url', { method: 'POST', body: JSON.stringify({ url, name, folder }) })
  }

  getDataset(id) {
    return this.request(`/datasets/${id}`)
  }

  updateDataset(id, data) {
    return this.request(`/datasets/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  deleteDataset(id) {
    return this.request(`/datasets/${id}`, { method: 'DELETE' })
  }

  previewDataset(id, limit = 50) {
    return this.request(`/datasets/${id}/preview?limit=${limit}`)
  }

  datasetSchema(id) {
    return this.request(`/datasets/${id}/schema`)
  }

  summarizeDataset(id) {
    return this.request(`/datasets/${id}/summarize`, { method: 'POST' })
  }

  // ── Trained models ───────────────────────────────────────
  getModels() {
    return this.request('/trained-models')
  }

  getModel(id) {
    return this.request(`/trained-models/${id}`)
  }

  updateModel(id, data) {
    return this.request(`/trained-models/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  }

  deleteModel(id) {
    return this.request(`/trained-models/${id}`, { method: 'DELETE' })
  }

  modelSchema(id) {
    return this.request(`/trained-models/${id}/schema`)
  }

  predict(id, records) {
    return this.request(`/trained-models/${id}/predict`, { method: 'POST', body: JSON.stringify({ records }) })
  }

  rotateModelKey(id) {
    return this.request(`/trained-models/${id}/rotate-api-key`, { method: 'POST' })
  }

  modelDownloadUrl(id) {
    return `${API_BASE}/trained-models/${id}/download`
  }

  getHyperparameters() {
    return this.request('/autogluon/hyperparameters')
  }

  // ── Projects ─────────────────────────────────────────────
  getProjects() { return this.request('/projects') }
  createProject(data) { return this.request('/projects', { method: 'POST', body: JSON.stringify(data) }) }
  updateProject(id, data) { return this.request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }) }
  deleteProject(id) { return this.request(`/projects/${id}`, { method: 'DELETE' }) }

  // ── Agents ───────────────────────────────────────────────
  getAgents() { return this.request('/agents') }
  getAgent(id) { return this.request(`/agents/${id}`) }
  createAgent(data) { return this.request('/agents', { method: 'POST', body: JSON.stringify(data) }) }
  updateAgent(id, data) { return this.request(`/agents/${id}`, { method: 'PUT', body: JSON.stringify(data) }) }
  deleteAgent(id) { return this.request(`/agents/${id}`, { method: 'DELETE' }) }
  chatAgent(id, message, sessionId = 'default') {
    return this.request(`/agents/${id}/chat`, { method: 'POST', body: JSON.stringify({ message, session_id: sessionId }) })
  }

  // ── Usage analytics ──────────────────────────────────────
  usageSummary(days = 30) { return this.request(`/usage/summary?days=${days}`) }
  usageByModel() { return this.request('/usage/models') }
  usageDaily(days = 30) { return this.request(`/usage/daily?days=${days}`) }

  // ── Vectors ──────────────────────────────────────────────
  getCollections() { return this.request('/vectors') }
  getCollection(name) { return this.request(`/vectors/${encodeURIComponent(name)}`) }
  deleteCollection(name) { return this.request(`/vectors/${encodeURIComponent(name)}`, { method: 'DELETE' }) }

  // ── Notifications ────────────────────────────────────────
  getNotifications() { return this.request('/notifications') }
  unreadCount() { return this.request('/notifications/unread-count') }
  markRead(id) { return this.request(`/notifications/${id}/read`, { method: 'POST' }) }
  markAllRead() { return this.request('/notifications/read-all', { method: 'POST' }) }

  // ── UI Builder ───────────────────────────────────────────
  getUIProjects() { return this.request('/ui-projects') }
  getUIProject(id) { return this.request(`/ui-projects/${id}`) }
  createUIProject(name) { return this.request('/ui-projects', { method: 'POST', body: JSON.stringify({ name }) }) }
  updateUIProject(id, data) { return this.request(`/ui-projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }) }
  publishUIProject(id) { return this.request(`/ui-projects/${id}/publish`, { method: 'POST' }) }
  deleteUIProject(id) { return this.request(`/ui-projects/${id}`, { method: 'DELETE' }) }
  getPublicUI(publicId) { return this.request(`/ui-projects/public/${publicId}`) }

  // ── Databases ────────────────────────────────────────────
  getDatabases() { return this.request('/databases') }
  createDatabase(data) { return this.request('/databases', { method: 'POST', body: JSON.stringify(data) }) }
  testDatabase(id) { return this.request(`/databases/${id}/test`, { method: 'POST' }) }
  deleteDatabase(id) { return this.request(`/databases/${id}`, { method: 'DELETE' }) }

  // ── MFA ──────────────────────────────────────────────────
  mfaEnroll() { return this.request('/auth/mfa/enroll', { method: 'POST' }) }
  mfaVerify(code) { return this.request('/auth/mfa/verify', { method: 'POST', body: JSON.stringify({ code }) }) }
}

export const api = new ApiClient()
