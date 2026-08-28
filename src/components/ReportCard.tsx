import StatusBadge from '@/components/StatusBadge'
import { ReportCategory, ReportPriority, ReportStatus } from '@/generated/prisma/enums';
import { textToPascalCase } from '@/lib/utils';

export type ReportCardData = {
  id: string;
  title: string;
  description: string;
  status: ReportStatus;
  category: ReportCategory | null;
  priority: ReportPriority | null;
  image_urls: string[];
  raw_image_urls: string[];
  submitted_at: Date | string;
};

export type ReportCardDataWithOrg = ReportCardData & {
  organization?: { id: string; name: string; branch_name?: string | null } | null
}

export default function ReportCard({
  report,
  onClick,
}: {
  report: ReportCardDataWithOrg
  onClick?: () => void
}) {
  const thumb = report.image_urls[0] ?? report.raw_image_urls[0] ?? null
  const date =
    typeof report.submitted_at === 'string'
      ? report.submitted_at
      : report.submitted_at.toISOString()

  const orgLabel = report.organization
    ? report.organization.branch_name
      ? `${report.organization.name} – ${report.organization.branch_name}`
      : report.organization.name
    : null

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300"
    >
      <div className="flex gap-3">
        {thumb && (<>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumb}
            alt=""
            className="w-16 h-16 rounded-lg object-cover border border-slate-100 shrink-0"
          />
        </>)}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-medium text-slate-800">{report.title}</h2>
            <StatusBadge status={report.status} />
          </div>
          <p className="text-sm text-slate-500 mt-1 line-clamp-2">{report.description}</p>
          <div className="flex flex-wrap gap-x-3 mt-2 text-xs text-slate-400">
            <span>{textToPascalCase(report.category || "Unknown Category")}</span>
            <span>·</span>
            <span>{textToPascalCase(report.priority || "Unknown") + " Priority"}</span>
            <span>·</span>
            <span>{new Date(date).toLocaleDateString()}</span>
          </div>
          {orgLabel && (
            <p className="text-xs text-slate-600 mt-1.5">
              Assigned to <span className="font-medium text-slate-700">{orgLabel}</span>
            </p>
          )}
          {!orgLabel && (
            <p className="text-xs text-slate-400 mt-1.5">Unassigned</p>
          )}
        </div>
      </div>
    </button>
  )
}
