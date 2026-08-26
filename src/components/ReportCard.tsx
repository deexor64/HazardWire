import StatusBadge from "@/components/StatusBadge";
import type { ReportCardData } from "@/lib/types";
import Image from "next/image";

export default function ReportCard({
  report,
  onClick,
}: {
  report: ReportCardData;
  onClick?: () => void;
}) {
  const thumb = report.image_urls[0] ?? report.raw_image_urls[0] ?? null;
  const date =
    typeof report.submitted_at === "string"
      ? report.submitted_at
      : report.submitted_at.toISOString();

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300"
    >
      <div className="flex gap-3">
        {thumb && (
          <Image
            src={thumb}
            alt=""
            className="w-16 h-16 rounded-lg object-cover border border-slate-100 shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-medium text-slate-800">{report.title}</h2>
            <StatusBadge status={report.status} />
          </div>
          <p className="text-sm text-slate-500 mt-1 line-clamp-2">
            {report.description}
          </p>
          <div className="flex flex-wrap gap-x-3 mt-2 text-xs text-slate-400">
            <span>{report.category ?? "Uncategorized"}</span>
            <span>·</span>
            <span>{report.priority ?? "UNKNOWN"}</span>
            <span>·</span>
            <span>{new Date(date).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
