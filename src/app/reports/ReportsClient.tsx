"use client";

import { useEffect, useState } from "react";
import { getReports } from "@/lib/api";
import ReportCard from "@/components/ReportCard";
import StatusBadge from "@/components/StatusBadge";
import InfoItem from "@/components/InfoItem";
import { ReportCategory, ReportStatus } from "@/generated/prisma/enums";
import Image from "next/image";
import { publicImageUrls, textToPascalCase } from "@/lib/utils";
import MessageBox, { MessageBoxProps } from "@/components/MessageBox";
import { Prisma } from "@/generated/prisma/client";
import { useAuth } from "@/hooks/UseAuth";

type ReportFilters = {
  category?: ReportCategory;
  status?: ReportStatus;
  assigned_to_me?: boolean;
  page?: number;
  page_size?: number;
};

type ReportListItem = Prisma.ReportGetPayload<{
  include: {
    organization: {
      select: { id: true; name: true; branch_name: true };
    };
  };
}>;

type AnalysisJson = {
  summary?: string;
  explanation?: string;
  priority_score?: number;
};

export default function ReportsClient() {
  const { auth } = useAuth();

  const [reports, setReports] = useState<ReportListItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<MessageBoxProps | null>(null);
  const [selected, setSelected] = useState<ReportListItem | null>(null);

  // Filters
  const [category, setCategory] = useState<ReportCategory | "">("");
  const [status, setStatus] = useState<ReportStatus | "">("");
  const [assignedToMe, setAssignedToMe] = useState(false);

  useEffect(() => {
      if (!auth.token && assignedToMe) {
        setAssignedToMe(false);
      }
    }, [auth.token, assignedToMe]);

  useEffect(() => {
    setLoading(true);
    setMessage(null);

    getReports(
      {
        page_size: 50,
        category: category || undefined,
        status: status || undefined,
        assigned_to_me: assignedToMe ? true : undefined,
      },
      assignedToMe ? auth.token : null,
    )
      .then((data) => setReports(data.results ?? []))
      .catch(() =>
        setMessage({
          messageType: "error",
          message: "Failed to fetch reports",
        }),
      )
      .finally(() => setLoading(false));
    }, [category, status, assignedToMe, auth.token]);

  if (selected) {
    return <ReportDetails report={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-800">
          {assignedToMe ? "Assigned to me" : "All Reports"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {assignedToMe
            ? "Reports assigned to your organisation."
            : "Public list of reported hazards across the country."}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <select
          value={category}
          onChange={(e) =>
            setCategory((e.target.value || "") as ReportCategory | "")
          }
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
        >
          <option value="">All Categories</option>
          {Object.values(ReportCategory).map((c) => (
            <option key={c} value={c}>
              {textToPascalCase(c)}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) =>
            setStatus((e.target.value || "") as ReportStatus | "")
          }
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
        >
          <option value="">All Statuses</option>
          {Object.values(ReportStatus).map((s) => (
            <option key={s} value={s}>
              {textToPascalCase(s)}
            </option>
          ))}
        </select>

        {/* Only for logged-in organisations */}
        {auth.token && (
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={assignedToMe}
              onChange={(e) => setAssignedToMe(e.target.checked)}
              className="rounded border-slate-300"
            />
            Assigned to Me
          </label>
        )}
      </div>

      {/* message / loading / list — same as before */}
      {message && (
        <MessageBox messageType={message.messageType} message={message.message} />
      )}

      {loading ? (
        <div className="text-center py-16 text-slate-500 text-sm">Loading…</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 text-slate-500 text-sm">
          No reports found.
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <ReportCard key={r.id} report={r} onClick={() => setSelected(r)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportDetails({
  report,
  onBack,
}: {
  report: ReportListItem;
  onBack: () => void;
}) {
  const images = publicImageUrls(report.image_urls, report.raw_image_urls)
  const analysis = report.analysis as AnalysisJson | null;

  return (
    <div className="max-w-xl mx-auto">
      <button
        onClick={onBack}
        className="text-sm text-slate-500 hover:text-slate-800 mb-4"
      >
        ← Back to all reports
      </button>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
          <h2 className="font-semibold text-slate-800">{report.title}</h2>
          <StatusBadge status={textToPascalCase(report.status || ReportStatus.PENDING) as ReportStatus} />
        </div>

        <div className="px-5 py-4 space-y-4">
          <p className="text-sm text-slate-600">{report.description}</p>

          {images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((url) => (
                <Image
                  width={200}
                  height={200}
                  key={url}
                  src={url}
                  alt=""
                  className="h-28 rounded-lg object-cover border"
                />
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <InfoItem label="Category" value={textToPascalCase(report.category || "Unknown Category")} />
            <InfoItem label="Priority" value={textToPascalCase(report.priority || "Unknown") + " Priority"} />
            <InfoItem
              label="Submitted"
              value={new Date(report.submitted_at).toLocaleString()}
            />
            <InfoItem
              label="Location"
              value={`${report.latitude}, ${report.longitude}`}
            />
          </div>

          <InfoItem
            label="Organization"
            value={
              report.organization
                ? report.organization.branch_name
                  ? `${report.organization.name} – ${report.organization.branch_name}`
                  : report.organization.name
                : 'Unassigned'
            }
          />

          {analysis?.summary && (
            <div className="pt-3 border-t border-slate-100 space-y-1">
              <p className="text-xs font-medium text-slate-500">
                System analysis
              </p>
              <p className="text-sm text-slate-600">{analysis.summary}</p>
              {analysis.explanation && (
                <p className="text-sm text-slate-500">{analysis.explanation}</p>
              )}
            </div>
          )}

          {report.comments.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <p className="text-xs font-medium text-slate-500 mb-2">
                Comments
              </p>
              <ul className="space-y-2">
                {report.comments.map((c, i) => (
                  <li
                    key={i}
                    className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3"
                  >
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
