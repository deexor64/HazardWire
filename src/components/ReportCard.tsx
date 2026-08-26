import type { Report } from '@/lib/types'
import { SEVERITY_BG, STATUS_BG, CATEGORY_ICON, relativeTime } from '@/lib/utils'

interface Props {
  report: Report
  onClose?: () => void
  expanded?: boolean
  onClick?: () => void
}

export default function ReportCard({ report, onClose, expanded, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className={`bg-[#1a1d2e] border border-[#2a2d3e] rounded-2xl overflow-hidden shadow-2xl ${onClick ? 'cursor-pointer' : ''}`}
    >
      {/* Top stripe by severity */}
      <div className="h-0.5 w-full" style={{ background: getSeverityGradient(report.severity) }} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg flex-shrink-0">{CATEGORY_ICON[report.category]}</span>
            <div className="min-w-0">
              <h3 className="font-semibold text-[#f1f5f9] text-sm leading-tight line-clamp-2">{report.title}</h3>
              <p className="text-[10px] text-slate-500 mt-0.5 font-mono">{report.id.slice(0, 8)}…</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Badge className={SEVERITY_BG[report.severity]}>{report.severity}</Badge>
            {onClose && (
              <button
                onClick={(e) => { e.stopPropagation(); onClose() }}
                className="w-6 h-6 rounded-full bg-[#2a2d3e] hover:bg-[#3a3d4e] flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {expanded && (
          <>
            <p className="text-sm text-slate-300 mb-3 leading-relaxed">{report.description}</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <InfoRow label="Status" value={<Badge className={STATUS_BG[report.status]}>{report.status.replace('_', ' ')}</Badge>} />
              <InfoRow label="Category" value={report.category} />
              {report.authority && <InfoRow label="Authority" value={report.authority} />}
              {report.latitude && report.longitude && (
                <InfoRow label="Location" value={`${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`} />
              )}
            </div>
          </>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-[#2a2d3e]">
          <Badge className={STATUS_BG[report.status]}>{report.status.replace('_', ' ')}</Badge>
          <span className="text-[10px] text-slate-500">{relativeTime(report.submitted_at)}</span>
        </div>
      </div>
    </div>
  )
}

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${className}`}>
      {children}
    </span>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
      <div className="text-xs text-slate-300 font-medium">{value}</div>
    </div>
  )
}

function getSeverityGradient(s: string) {
  const map: Record<string, string> = {
    critical: 'linear-gradient(90deg, #ef4444, #dc2626)',
    high: 'linear-gradient(90deg, #f97316, #ea580c)',
    medium: 'linear-gradient(90deg, #eab308, #ca8a04)',
    low: 'linear-gradient(90deg, #22c55e, #16a34a)',
  }
  return map[s] ?? map.low
}
