import type { ReportStatus } from "@/generated/prisma/client";

const STYLES: Record<ReportStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  ASSIGNED: "bg-blue-50 text-blue-700 border-blue-200",
  IN_PROGRESS: "bg-indigo-50 text-indigo-700 border-indigo-200",
  RESOLVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CLOSED: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function StatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span
      className={`text-xs font-medium px-2.5 py-1 rounded-full border shrink-0 ${STYLES[status]}`}
    >
      {status.toLowerCase().replaceAll("_", " ")}
    </span>
  );
}
