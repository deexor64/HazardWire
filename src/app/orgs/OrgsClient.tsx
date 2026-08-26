"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/utils/client";
import { useAuth } from "@/components/AuthProvider";
import {
  getOrgProfile,
  getOrgReports,
  updateOrgProfile,
  updateOrgReport,
} from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import type {
  Organization,
  Report,
  ReportStatus,
} from "@/generated/prisma/client";

type Mode = "login" | "signup";
type Tab = "reports" | "profile";

export default function OrgsClient() {
  const { auth, setAuth } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [tab, setTab] = useState<Tab>("reports");
  const [profile, setProfile] = useState<Organization | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [dashLoading, setDashLoading] = useState(false);
  const [dashError, setDashError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadDashboard = useCallback(async (token: string) => {
    setDashLoading(true);
    setDashError("");
    try {
      const [p, r] = await Promise.all([
        getOrgProfile(token),
        getOrgReports(token),
      ]);
      setProfile(p);
      setReports(r);
    } catch (e) {
      setDashError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setDashLoading(false);
    }
  }, []);

  useEffect(() => {
    if (auth.token) {
      void loadDashboard(auth.token);
    }
  }, [auth.token, loadDashboard]);

  async function handleSubmit() {
    setLoading(true);
    setError("");
    const supabase = createClient();

    try {
      if (mode === "signup") {
        if (!name.trim()) {
          setError("Organisation name is required.");
          return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;

        const session = data.session;
        const user = data.user;
        if (!session || !user) {
          setError("Check your email to confirm the account, then sign in.");
          return;
        }

        const res = await fetch("/api/orgs/profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ name: name.trim(), email }),
        });
        const json = await res.json();
        if (!json.status)
          throw new Error(json.result || "Failed to create profile");

        setAuth({
          token: session.access_token,
          userId: user.id,
          email: user.email ?? email,
        });
      } else {
        const { data, error: signInError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });
        if (signInError) throw signInError;

        setAuth({
          token: data.session.access_token,
          userId: data.user.id,
          email: data.user.email ?? email,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Auth failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setAuth({ token: null, userId: null, email: null });
    setProfile(null);
    setReports([]);
  }

  async function handleSaveProfile() {
    if (!auth.token || !profile) return;
    setSaving(true);
    setDashError("");
    try {
      const updated = await updateOrgProfile(auth.token, {
        name: profile.name,
        branch_name: profile.branch_name,
        description: profile.description,
        phones: profile.phones,
        address: profile.address,
        website: profile.website,
        coverage_region: profile.coverage_region,
        coverage_areas: profile.coverage_areas,
        responsibilities: profile.responsibilities,
        keywords: profile.keywords,
      });
      setProfile(updated);
    } catch (e) {
      setDashError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(reportId: string, status: ReportStatus) {
    if (!auth.token) return;
    try {
      const updated = await updateOrgReport(auth.token, reportId, { status });
      setReports((prev) => prev.map((r) => (r.id === reportId ? updated : r)));
    } catch (e) {
      setDashError(e instanceof Error ? e.message : "Update failed");
    }
  }

  if (auth.token) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">
              Organisation dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-1">{auth.email}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>

        <div className="flex gap-2 mb-5">
          <button
            type="button"
            onClick={() => setTab("reports")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${
              tab === "reports"
                ? "bg-slate-800 text-white"
                : "bg-white border text-slate-600"
            }`}
          >
            Assigned reports
          </button>
          <button
            type="button"
            onClick={() => setTab("profile")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${
              tab === "profile"
                ? "bg-slate-800 text-white"
                : "bg-white border text-slate-600"
            }`}
          >
            Profile
          </button>
        </div>

        {dashError && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {dashError}
          </div>
        )}

        {dashLoading ? (
          <div className="text-center py-16 text-slate-500 text-sm">
            Loading…
          </div>
        ) : tab === "reports" ? (
          <div className="space-y-3">
            {reports.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-sm">
                No reports assigned to your organisation yet.
              </div>
            ) : (
              reports.map((r) => (
                <div
                  key={r.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-medium text-slate-800">{r.title}</h2>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2">
                    {r.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span>{r.category ?? "—"}</span>
                    <span>·</span>
                    <span>{r.priority ?? "—"}</span>
                  </div>
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
                        onClick={() => handleStatusChange(r.id, s)}
                        className={`text-xs px-2.5 py-1 rounded-full border ${
                          r.status === s
                            ? "bg-slate-800 text-white border-slate-800"
                            : "bg-white text-slate-600 border-slate-200"
                        }`}
                      >
                        {s.toLowerCase().replaceAll("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : profile ? (
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <Field
              label="Name"
              value={profile.name}
              onChange={(v) => setProfile({ ...profile, name: v })}
            />
            <Field
              label="Branch name"
              value={profile.branch_name ?? ""}
              onChange={(v) =>
                setProfile({ ...profile, branch_name: v || null })
              }
            />
            <Field
              label="Description"
              value={profile.description ?? ""}
              onChange={(v) =>
                setProfile({ ...profile, description: v || null })
              }
              textarea
            />
            <Field
              label="Phones (comma-separated)"
              value={profile.phones.join(", ")}
              onChange={(v) =>
                setProfile({
                  ...profile,
                  phones: v
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
            <Field
              label="Address"
              value={profile.address ?? ""}
              onChange={(v) => setProfile({ ...profile, address: v || null })}
            />
            <Field
              label="Website"
              value={profile.website ?? ""}
              onChange={(v) => setProfile({ ...profile, website: v || null })}
            />
            <Field
              label="Coverage region"
              value={profile.coverage_region ?? ""}
              onChange={(v) =>
                setProfile({ ...profile, coverage_region: v || null })
              }
            />
            <Field
              label="Responsibilities (comma-separated)"
              value={profile.responsibilities.join(", ")}
              onChange={(v) =>
                setProfile({
                  ...profile,
                  responsibilities: v
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
            <Field
              label="Keywords (comma-separated)"
              value={profile.keywords.join(", ")}
              onChange={(v) =>
                setProfile({
                  ...profile,
                  keywords: v
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full py-2.5 bg-slate-800 text-white text-sm font-medium rounded-lg disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save profile"}
            </button>
          </div>
        ) : (
          <div className="text-center py-16 text-slate-500 text-sm">
            No profile found.
          </div>
        )}
      </div>
    );
  }

  // login / signup form (unchanged layout)
  return (
    <div className="max-w-md mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-xl font-semibold text-slate-800">
          {mode === "login" ? "Organisation Login" : "Register Organisation"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {mode === "login"
            ? "Sign in to manage hazard reports"
            : "Create an account for your organisation"}
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        {mode === "signup" && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Organisation Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-base w-full"
              placeholder="e.g. Road Development Authority"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-base w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-base w-full"
          />
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-2.5 bg-slate-800 text-white text-sm font-medium rounded-lg disabled:opacity-50"
        >
          {loading
            ? "Please wait…"
            : mode === "login"
              ? "Sign In"
              : "Create Account"}
        </button>
      </div>

      <p className="text-center text-sm text-slate-500 mt-5">
        {mode === "login"
          ? "Don't have an account? "
          : "Already have an account? "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError("");
          }}
          className="text-orange-600 font-medium hover:underline"
        >
          {mode === "login" ? "Register" : "Sign in"}
        </button>
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
      </label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="input-base w-full resize-none"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-base w-full"
        />
      )}
    </div>
  );
}
