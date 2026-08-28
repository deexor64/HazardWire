import { ReportCategory, ReportPriority, ReportStatus } from "@/generated/prisma/enums"
import { Geo } from "./types"
import { JsonValue } from "@/generated/prisma/internal/prismaNamespace"

export const SEVERITY_COLOR: Record<ReportPriority, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#22c55e',
  UNKNOWN: '#6b7280',
}

export const SEVERITY_BG: Record<ReportPriority, string> = {
  CRITICAL: 'bg-red-500/15 text-red-400 border-red-500/30',
  HIGH: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  MEDIUM: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  LOW: 'bg-green-500/15 text-green-400 border-green-500/30',
  UNKNOWN: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
}

export const STATUS_BG: Record<ReportStatus, string> = {
  PENDING: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  ASSIGNED: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  IN_PROGRESS: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  RESOLVED: 'bg-green-500/15 text-green-400 border-green-500/30',
  CLOSED: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
}

export const CATEGORY_ICON: Record<ReportCategory, string> = {
  ROAD: '🛣️',
  WATER: '💧',
  IRRIGATION: '🌾',
  CONSTRUCTION: '🏗️',
  // ELECTRICITY: '⚡',
  GARBAGE: '🗑️',
  ENVIRONMENT: '🌿',
  // ANIMALS: '🐾',
  ACCIDENT: '💥',
  CRIME: '🚨',
  GENERAL: '📌',
}

export const CATEGORY_LABEL: Record<ReportCategory, string> = {
  ROAD: 'Road',
  WATER: 'Water',
  IRRIGATION: 'Irrigation',
  CONSTRUCTION: 'Construction',
  // ELECTRICITY: 'Electricity',
  GARBAGE: 'Garbage',
  ENVIRONMENT: 'Environment',
  // ANIMALS: 'Animals',
  ACCIDENT: 'Accident',
  CRIME: 'Crime',
  GENERAL: 'General',
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

export function createMarkerIcon(priority: ReportPriority) {
  const color = SEVERITY_COLOR[priority]
  const pulse = priority === 'CRITICAL'
  const size = priority === 'CRITICAL' ? 14 : 11
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

export function publicImageUrls(
  image_urls: string[] | null | undefined,
  raw_image_urls?: string[] | null
): string[] {
  const preferred = image_urls?.length ? image_urls : raw_image_urls ?? []
  return preferred.filter(
    (u) => typeof u === 'string' && (u.startsWith('http://') || u.startsWith('https://'))
  )
}

export function readGeoFromJson(geo: JsonValue): Geo {
  const g = geo
  if (!g || typeof g !== 'object' || Array.isArray(g)) return {}
  return g as Geo
}

export function textToPascalCase(text: string): string {
  const t = text.replaceAll("_", "-");
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
}
