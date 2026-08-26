"use client";

import { useEffect, useState } from "react";
import { getOrgs } from "@/lib/api";
import type { OrgCardData } from "@/lib/types";

export default function OrganizationsClient() {
  const [orgs, setOrgs] = useState<OrgCardData[]>([]);
  const [selected, setSelected] = useState<OrgCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getOrgs()
      .then(setOrgs)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-800">Organizations</h1>
        <p className="text-sm text-slate-500 mt-1">
          Registered organisations that handle hazard reports.
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-slate-500 text-sm">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {orgs.map((org) => (
            <button
              key={org.id}
              type="button"
              onClick={() => setSelected(org)}
              className="text-left bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300"
            >
              <div className="flex justify-between gap-2 mb-2">
                <h2 className="font-medium text-slate-800">
                  {org.name}
                  {org.branch_name ? ` – ${org.branch_name}` : ""}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full border shrink-0">
                  {org.verified ? "Verified" : "Unverified"}
                </span>
              </div>
              <p className="text-sm text-slate-500">{org.org_type}</p>
              {org.phones[0] && (
                <p className="text-sm text-slate-600 mt-1">{org.phones[0]}</p>
              )}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 border shadow-lg">
            <div className="flex justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">{selected.name}</h2>
                <p className="text-sm text-slate-500">{selected.org_type}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-xl text-slate-400"
              >
                ×
              </button>
            </div>
            <div className="space-y-2 text-sm text-slate-700">
              {selected.coverage_region && (
                <p>Region: {selected.coverage_region}</p>
              )}
              {selected.phones[0] && <p>Phone: {selected.phones[0]}</p>}
              {selected.address && <p>Address: {selected.address}</p>}
              {selected.website && <p>Web: {selected.website}</p>}
              {selected.description && <p>{selected.description}</p>}
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="w-full mt-6 py-2.5 border rounded-lg text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
