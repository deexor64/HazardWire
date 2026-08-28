"use client";

import { useEffect, useState } from "react";
import { getOrgs } from "@/lib/api";
import { OrgType } from "@/generated/prisma/enums";
import MessageBox, { MessageBoxProps } from "@/components/MessageBox";
import { textToPascalCase } from "@/lib/utils";

export type OrgCardData = {
  id: string;
  name: string;
  branch_name: string | null;
  org_type: OrgType;
  verified: boolean;
  phones: string[];
  coverage_region: string | null;
  description: string | null;
  website: string | null;
  address: string | null;
  logo_url: string | null;
  responsibilities: string[];
};

export default function OrganizationsClient() {
  const [orgs, setOrgs] = useState<OrgCardData[]>([]);

  const [selected, setSelected] = useState<OrgCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<MessageBoxProps | null>(null);

  // Filters
  const [nameQuery, setNameQuery] = useState("");
  const [orgType, setOrgType] = useState<OrgType | "">("");

  useEffect(() => {
    getOrgs()
      .then(setOrgs)
      .catch((e: Error) =>
        setMessage({ message: e.message, messageType: "error" }),
      )
      .finally(() => setLoading(false));
  }, []);

  // Apply filters (explicit)
  const nameLower = nameQuery.trim().toLowerCase();
  const filtered = orgs.filter((org) => {
    if (orgType && org.org_type !== orgType) {
      return false;
    }
    if (nameLower) {
      const label = `${org.name} ${org.branch_name || ""}`.toLowerCase();
      if (!label.includes(nameLower)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="max-w-3xl mx-auto">
      {/* Heading */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-800">Organizations</h1>
        <p className="text-sm text-slate-500 mt-1">
          Registered organisations that handle hazard reports.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          value={nameQuery}
          onChange={(e) => setNameQuery(e.target.value)}
          placeholder="Search by name…"
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white min-w-[12rem] flex-1"
        />

        <select
          value={orgType}
          onChange={(e) => setOrgType((e.target.value || "") as OrgType | "")}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
        >
          <option value="">All types</option>
          {Object.values(OrgType).map((t) => (
            <option key={t} value={t}>
              {textToPascalCase(t)}
            </option>
          ))}
        </select>
      </div>

      {/* Message box */}
      {message && <MessageBox {...message} />}

      {/* Content */}
      {loading ? (
        <div className="text-center py-16 text-slate-500 text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500 text-sm">
          No organisations found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((org) => (
            <OrgCard key={org.id} org={org} setSelected={setSelected} />
          ))}
        </div>
      )}

      {/* Org details popup */}
      {selected && (
        <OrgDetails selected={selected} setSelected={setSelected} />
      )}
    </div>
  );
}


function OrgCard({ org, setSelected }: { org: OrgCardData; setSelected: React.Dispatch<React.SetStateAction<OrgCardData | null>> }) {
  return (
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
      <p className="text-sm text-slate-500">{textToPascalCase(org.org_type)}</p>
      {org.phones[0] && (
        <p className="text-sm text-slate-600 mt-1">{org.phones[0]}</p>
      )}
    </button>
  )
}

function OrgDetails({ selected, setSelected }: { selected: OrgCardData | null; setSelected: React.Dispatch<React.SetStateAction<OrgCardData | null>> }) {
  if (!selected) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 border shadow-lg">
        <div className="flex justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">{selected.name}</h2>
            <p className="text-sm text-slate-500">{textToPascalCase(selected.org_type)}</p>
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
  );
}
