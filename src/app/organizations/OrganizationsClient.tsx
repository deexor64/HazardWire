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

  useEffect(() => {
    getOrgs()
      .then(setOrgs)
      .catch((e: Error) => setMessage({ message: e.message, messageType: "error" }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Heading */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-800">Organizations</h1>
        <p className="text-sm text-slate-500 mt-1">
          Registered organisations that handle hazard reports.
        </p>
      </div>

      {/* Message box */}
      {message && <MessageBox {...message} />}

      {/* Content */}
      {loading ? (
        <div className="text-center py-16 text-slate-500 text-sm">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {orgs.map((org) => (
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
