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
import { useAuth } from "@/hooks/UseAuth";
import { updateOrgReport } from "@/lib/api";
import { AnalysisJson, ReportListItem } from "@/lib/types";


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
      return (
        <ReportDetails
          report={selected}
          onBack={() => setSelected(null)}
          onReportUpdate={(updated) => {
            setSelected(updated);
            setReports((prev) =>
              prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)),
            );
          }}
        />
      );
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
  onReportUpdate,
}: {
  report: ReportListItem;
  onBack: () => void;
  onReportUpdate: (report: ReportListItem) => void;
}) {
  const { auth } = useAuth();
  const images = publicImageUrls(report.image_urls, report.raw_image_urls);
  const analysis = report.analysis as AnalysisJson | null;

  const canManage =
    !!auth.token && !!auth.userId && auth.userId === report.org_id;

  const [commentText, setCommentText] = useState("");
  const [busy, setBusy] = useState(false);
  const [localMessage, setLocalMessage] = useState<MessageBoxProps | null>(null);

  async function handleAddComment() {
    if (!auth.token || !commentText.trim()) return;
    setBusy(true);
    setLocalMessage(null);
    try {
      const updated = await updateOrgReport(auth.token, report.id, {
        comment: commentText.trim(),
      });
      setCommentText("");
      onReportUpdate({ ...report, ...updated });
    } catch (e) {
      setLocalMessage({
        messageType: "error",
        message: e instanceof Error ? e.message : "Failed to add comment",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteComment(index: number) {
    if (!auth.token) return;
    setBusy(true);
    setLocalMessage(null);
    try {
      const updated = await updateOrgReport(auth.token, report.id, {
        delete_comment_index: index,
      });
      onReportUpdate({ ...report, ...updated });
    } catch (e) {
      setLocalMessage({
        messageType: "error",
        message: e instanceof Error ? e.message : "Failed to delete comment",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleStatusChange(status: ReportStatus) {
    if (!auth.token) return;
    setBusy(true);
    setLocalMessage(null);
    try {
      const updated = await updateOrgReport(auth.token, report.id, { status });
      onReportUpdate({ ...report, ...updated });
    } catch (e) {
      setLocalMessage({
        messageType: "error",
        message: e instanceof Error ? e.message : "Failed to update status",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-slate-500 hover:text-slate-800 mb-4"
      >
        ← Back to all reports
      </button>

      {localMessage && (
        <div className="mb-4">
          <MessageBox
            messageType={localMessage.messageType}
            message={localMessage.message}
          />
        </div>
      )}

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
            <InfoItem
              label="Category"
              value={textToPascalCase(report.category || "Unknown Category")}
            />
            <InfoItem
              label="Priority"
              value={
                textToPascalCase(report.priority || "Unknown") + " Priority"
              }
            />
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
                : "Unassigned"
            }
          />

          {/* Status controls — only for assigned organisation */}
          {canManage && (
            <div className="pt-3 border-t border-slate-100">
              <p className="text-xs font-medium text-slate-500 mb-2">Status</p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    "ASSIGNED",
                    "IN_PROGRESS",
                    "RESOLVED",
                    "CLOSED",
                  ] as ReportStatus[]
                ).map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={busy}
                    onClick={() => handleStatusChange(s)}
                    className={`text-xs px-2.5 py-1 rounded-full border ${
                      report.status === s
                        ? "bg-slate-800 text-white border-slate-800"
                        : "bg-white text-slate-600 border-slate-200"
                    } disabled:opacity-50`}
                  >
                    {textToPascalCase(s)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {analysis && (analysis.summary || analysis.explanation || analysis.routing_reason) && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <p className="text-xs font-medium text-slate-500">
                System analysis
              </p>
              {analysis.summary && (
                <p className="text-sm text-slate-600">{analysis.summary}</p>
              )}
              {analysis.explanation && (
                <p className="text-sm text-slate-500">{analysis.explanation}</p>
              )}
              {analysis.routing_reason && (
                <p className="text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-3">
                  <span className="text-xs font-medium text-slate-500 block mb-1">
                    Routing
                  </span>
                  {analysis.routing_reason}
                </p>
              )}
              {analysis.possible_duplicate && analysis.duplicates && analysis.duplicates.length > 0 && (
                <div className="text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-900">
                  <p className="text-xs font-medium mb-1">Possible duplicate nearby</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {analysis.duplicates.map((d) => (
                      <li key={d.id}>
                        {d.title || d.id}
                        {d.distance_km != null ? ` (~${d.distance_km} km)` : ""}
                        {d.status ? ` · ${d.status}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Comments */}
          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-500 mb-2">Comments</p>

            {report.comments.length === 0 ? (
              <p className="text-sm text-slate-400 mb-3">No comments yet.</p>
            ) : (
              <ul className="space-y-2 mb-3">
                {report.comments.map((c, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg p-3"
                  >
                    <span className="flex-1">{c}</span>
                    {canManage && (
                      <button
                        type="button"
                        title="Delete comment"
                        disabled={busy}
                        onClick={() => handleDeleteComment(i)}
                        className="text-slate-400 hover:text-red-600 shrink-0 text-sm disabled:opacity-50"
                      >
                        🗑
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {canManage ? (
              <div className="flex gap-2">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="input-base flex-1 text-sm"
                  placeholder="Add a public update…"
                  disabled={busy}
                />
                <button
                  type="button"
                  onClick={handleAddComment}
                  disabled={busy || !commentText.trim()}
                  className="px-3 py-2 text-sm rounded-lg bg-slate-800 text-white disabled:opacity-50"
                >
                  Post
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Comments are read-only.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
