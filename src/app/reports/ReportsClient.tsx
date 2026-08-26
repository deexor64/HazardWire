"use client";

import { useEffect, useState } from "react";
import { getReports } from "@/lib/api";
import ReportCard from "@/components/ReportCard";
import StatusBadge from "@/components/StatusBadge";
import InfoItem from "@/components/InfoItem";
import type { ReportCategory, ReportStatus } from "@/generated/prisma/client";
import type { AnalysisJson, ReportListItem } from "@/lib/types";
import Image from "next/image";

const CATEGORIES: ReportCategory[] = [
  "ROAD",
  "WATER",
  "IRRIGATION",
  "GARBAGE",
  "ENVIRONMENT",
  "ACCIDENT",
  "CONSTRUCTION",
  "CRIME",
  "GENERAL",
];

const STATUSES: ReportStatus[] = [
  "PENDING",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
];

export default function ReportsClient() {
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<ReportListItem | null>(null);
  const [category, setCategory] = useState<ReportCategory | "">("");
  const [status, setStatus] = useState<ReportStatus | "">("");

  useEffect(() => {
    setLoading(true);
    setError("");
    getReports({
      page_size: 50,
      category: category || undefined,
      status: status || undefined,
    })
      .then((data) => setReports(data.results ?? []))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [category, status]);

  if (selected) {
    return <ReportDetail report={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-800">All Reports</h1>
        <p className="text-sm text-slate-500 mt-1">
          Public list of reported hazards across the country.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <select
          value={category}
          onChange={(e) =>
            setCategory((e.target.value || "") as ReportCategory | "")
          }
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
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
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
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

function ReportDetail({
  report,
  onBack,
}: {
  report: ReportListItem;
  onBack: () => void;
}) {
  const images = report.image_urls.length
    ? report.image_urls
    : report.raw_image_urls;
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
          <StatusBadge status={report.status} />
        </div>

        <div className="px-5 py-4 space-y-4">
          <p className="text-sm text-slate-600">{report.description}</p>

          {images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((url) => (
                <Image
                  key={url}
                  src={url}
                  alt=""
                  className="h-28 rounded-lg object-cover border"
                />
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <InfoItem label="Category" value={report.category ?? "—"} />
            <InfoItem label="Priority" value={report.priority ?? "—"} />
            <InfoItem
              label="Submitted"
              value={new Date(report.submitted_at).toLocaleString()}
            />
            <InfoItem
              label="Location"
              value={`${report.latitude}, ${report.longitude}`}
            />
          </div>

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
