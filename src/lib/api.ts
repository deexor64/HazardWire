import type {
  ApiResponse,
  ReportFilters,
  ReportListItem,
  ReportListResult,
  ReportSubmitInput,
  SubmitResult,
  OrgCardData,
} from "./types";

const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.status) {
    throw new Error(
      typeof json.result === "string" ? json.result : "Request failed",
    );
  }
  return json.result;
}

export function getReports(filters: ReportFilters = {}) {
  const params = new URLSearchParams();
  if (filters.category) params.set("category", filters.category);
  if (filters.status) params.set("status", filters.status);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.page_size) params.set("page_size", String(filters.page_size));
  const qs = params.toString();
  return request<ReportListResult>(`/reports${qs ? `?${qs}` : ""}`);
}

export function getReportByToken(token: string) {
  return request<ReportListItem>(
    `/reports/by-token/${encodeURIComponent(token)}`,
  );
}

export function submitReport(body: ReportSubmitInput) {
  return request<SubmitResult>("/reports", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getOrgs() {
  return request<OrgCardData[]>("/orgs");
}

import type {
  Organization,
  Report,
  ReportStatus,
} from "@/generated/prisma/client";

async function authRequest<T>(
  path: string,
  token: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.status) {
    throw new Error(
      typeof json.result === "string" ? json.result : "Request failed",
    );
  }
  return json.result;
}

export function getOrgProfile(token: string) {
  return authRequest<Organization>("/orgs/profile", token);
}

export function updateOrgProfile(
  token: string,
  body: Partial<{
    name: string
    branch_name: string | null
    description: string | null
    phones: string[]
    address: string | null
    website: string | null
    coverage_region: string | null
    coverage_areas: string[]
    responsibilities: string[]
    keywords: string[]
    geo: {
      lat: number
      lng: number
      display_name?: string
      city?: string
      state?: string
    } | null
  }>,
) {
  return authRequest<Organization>('/orgs/profile', token, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function getOrgReports(token: string) {
  return authRequest<Report[]>("/orgs/reports", token);
}

export function updateOrgReport(
  token: string,
  reportId: string,
  body: {
    status?: ReportStatus
    comment?: string
    delete_comment_index?: number
    org_id?: string
  }
) {
  return authRequest<Report>(`/orgs/reports/${reportId}`, token, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export async function uploadRawImage(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/upload', { method: 'POST', body: form })
  const json = await res.json()
  if (!json.status) throw new Error(json.result || 'Upload failed')
  return json.result.path as string
}
