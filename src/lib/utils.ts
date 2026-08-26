import type { ReportSeverity, ReportStatus, ReportCategory } from './types'

export const SEVERITY_COLOR: Record<ReportSeverity, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
}

export const SEVERITY_BG: Record<ReportSeverity, string> = {
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  low: 'bg-green-500/15 text-green-400 border-green-500/30',
}

export const STATUS_BG: Record<ReportStatus, string> = {
  pending: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  assigned: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  in_review: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  resolved: 'bg-green-500/15 text-green-400 border-green-500/30',
}

export const CATEGORY_ICON: Record<ReportCategory, string> = {
  road: '🛣️', drainage: '🌊', water: '💧', electricity: '⚡',
  garbage: '🗑️', environment: '🌿', animals: '🐾',
  accident: '💥', crime: '🚨', other: '📌',
}

export const CATEGORY_LABEL: Record<ReportCategory, string> = {
  road: 'Road', drainage: 'Drainage', water: 'Water', electricity: 'Electricity',
  garbage: 'Garbage', environment: 'Environment', animals: 'Animals',
  accident: 'Accident', crime: 'Crime', other: 'Other',
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-LK', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function createMarkerIcon(severity: ReportSeverity) {
  const color = SEVERITY_COLOR[severity]
  const pulse = severity === 'critical'
  const size = severity === 'critical' ? 14 : 11
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
      ${pulse ? `<circle cx="16" cy="16" r="16" fill="${color}" opacity="0.2">
        <animate attributeName="r" values="10;18;10" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite"/>
      </circle>` : ''}
      <path d="M16 2C9.373 2 4 7.373 4 14c0 9 12 26 12 26S28 23 28 14C28 7.373 22.627 2 16 2z" fill="${color}" stroke="rgba(0,0,0,0.3)" stroke-width="1"/>
      <circle cx="16" cy="14" r="${size / 2 + 1}" fill="white" opacity="0.9"/>
      <circle cx="16" cy="14" r="${size / 2 - 1}" fill="${color}"/>
    </svg>`
  return svg
}
