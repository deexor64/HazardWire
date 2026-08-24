import type { Report, ReportFilters, ReportListResult, ReportSubmitBody } from './types'

const BASE = '/api'

async function request<T>(path: string, options?: RequestInit, token?: string | null): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(BASE + path, { ...options, headers: { ...headers, ...options?.headers } })
  const json = await res.json()
  if (!json.status) throw new Error(typeof json.result === 'string' ? json.result : `HTTP ${res.status}`)
  return json
}

// ── Reports ──────────────────────────────────────────────────────────────────

export async function getReports(filters: ReportFilters = {}): Promise<{ result: ReportListResult }> {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') params.set(k, String(v)) })
  const qs = params.toString()
  return request(`/reports${qs ? '?' + qs : ''}`)
}

export async function getReport(id: string): Promise<{ result: Report }> {
  return request(`/reports/${id}`)
}

export async function submitReport(body: any) {
  return request('/reports', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function getReportByToken(token: string) {
  return request(`/reports/by-token/${token}`)
}


// ── Orgs ─────────────────────────────────────────────────────────────────────

export async function orgSignup(name: string, email: string, password: string) {
  return request('/orgs/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  })
}

export async function orgLogin(email: string, password: string) {
  return request('/orgs/signin', { method: 'POST', body: JSON.stringify({ email, password }) })
}

export async function orgLogout(token: string) {
  return request('/orgs/logout', { method: 'POST' }, token)
}

export async function getMe(token: string) {
  return request('/orgs/profile', undefined, token)
}

export async function updateMe(token: string, updates: Record<string, string>) {
  return request('/orgs/profile', { method: 'PUT', body: JSON.stringify(updates) }, token)
}

export async function deleteMe(token: string) {
  return request('/orgs/profile', { method: 'DELETE' }, token)
}
