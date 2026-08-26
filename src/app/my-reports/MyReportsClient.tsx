"use client";

import { useState } from "react";
import { getReportByToken } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import InfoItem from "@/components/InfoItem";
import type { AnalysisJson, ReportListItem } from "@/lib/types";

export default function MyReportClient() {
  const [token, setToken] = useState("");
  const [report, setReport] = useState<ReportListItem | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    if (!token.trim()) {
      setError("Please enter your access token.");
      return;
    }
    setLoading(true);
    setError("");
    setReport(null);
    try {
      const res = await getReportByToken(token.trim());
      setReport(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Not found");
    } finally {
      setLoading(false);
    }
  }

  const analysis = report?.analysis as AnalysisJson | null;

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-800">My Report</h1>
        <p className="text-sm text-slate-500 mt-1">
          Enter the private access token from when you submitted the report.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Access Token
        </label>
        <div className="flex gap-2">
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="input-base flex-1"
            placeholder="Paste your token"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-5 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-lg disabled:opacity-50"
          >
            {loading ? "Checking…" : "Find Report"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {report && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between gap-3">
            <h2 className="font-semibold text-slate-800">{report.title}</h2>
            <StatusBadge status={report.status} />
          </div>
          <div className="px-5 py-4 space-y-4">
            <p className="text-sm text-slate-600">{report.description}</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <InfoItem label="Category" value={report.category ?? "—"} />
              <InfoItem label="Priority" value={report.priority ?? "—"} />
              <InfoItem
                label="Organization"
                value={report.organization?.name ?? "Unassigned"}
              />
              <InfoItem
                label="Submitted"
                value={new Date(report.submitted_at).toLocaleString()}
              />
            </div>
            {analysis?.summary && (
              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-1">
                  System analysis
                </p>
                <p className="text-sm text-slate-600">{analysis.summary}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
