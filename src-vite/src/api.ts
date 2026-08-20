import type { Report, ReportFilters, ReportListResult, ReportSubmitBody } from './types'

const BASE = '/api/v1'

async function request<T>(path: string, options?: RequestInit, token?: string | null): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(BASE + path, { ...options, headers: { ...headers, ...options?.headers } })
  const json = await res.json()
  if (!json.status && json.detail) throw new Error(json.detail)
  if (!res.ok && !json.status) throw new Error(json.message ?? `HTTP ${res.status}`)
  return json
}

// ── Reports ──────────────────────────────────────────────────────────────────

export async function getReports(filters: ReportFilters = {}): Promise<{ data: ReportListResult }> {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') params.set(k, String(v)) })
  const qs = params.toString()
  return request(`/reports${qs ? '?' + qs : ''}`)
}

export async function getReport(id: string): Promise<{ data: Report }> {
  return request(`/reports/${id}`)
}

export async function submitReport(body: ReportSubmitBody): Promise<{ data: Report; message: string }> {
  return request('/reports', { method: 'POST', body: JSON.stringify(body) })
}

// ── Orgs ─────────────────────────────────────────────────────────────────────

export async function orgSignup(email: string, password: string) {
  return request('/orgs/signup', { method: 'POST', body: JSON.stringify({ email, password }) })
}

export async function orgLogin(email: string, password: string) {
  return request('/orgs/login', { method: 'POST', body: JSON.stringify({ email, password }) })
}

export async function orgLogout(token: string) {
  return request('/orgs/logout', { method: 'POST' }, token)
}

export async function getMe(token: string) {
  return request('/orgs/me', undefined, token)
}

export async function updateMe(token: string, updates: Record<string, string>) {
  return request('/orgs/me', { method: 'PUT', body: JSON.stringify(updates) }, token)
}

export async function deleteMe(token: string) {
  return request('/orgs/me', { method: 'DELETE' }, token)
}
