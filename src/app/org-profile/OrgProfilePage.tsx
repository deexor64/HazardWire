"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/utils/client";
import { useAuth } from "@/hooks/UseAuth";
import { getOrgProfile, updateOrgProfile } from "@/lib/api";
import { Organization } from "@/generated/prisma/client";
import { OrgType } from "@/generated/prisma/enums";
import { useRouter } from "next/navigation";
import MessageBox, { MessageBoxProps } from "@/components/MessageBox";
import { readGeoFromJson, textToPascalCase } from "@/lib/utils";
import StringListInput from "@/components/StringListInput";
import OrgLocationMap from "@/components/OrgLocationMap";

function cleanStringList(values: string[]) {
  return values.map((s) => s.trim()).filter(Boolean);
}

export default function OrgProfilePage() {
  const router = useRouter();
  const { auth, setAuth } = useAuth();

  const [profile, setProfile] = useState<Organization | null>(null);

  // For location on map (only lat/lng are editable; full geo shown read-only)
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<MessageBoxProps | null>(null);

  const loadDashboard = useCallback(async (token: string) => {
    setLoading(true);
    setMessage(null);

    try {
      // Set profile
      const p = await getOrgProfile(token);
      setProfile(p);

      // Set latitude and longitude from geo
      const g = readGeoFromJson(p.geo);
      setLatitude(g.lat === undefined ? "" : g.lat.toString());
      setLongitude(g.lng === undefined ? "" : g.lng.toString());
    } catch (e) {
      setMessage({ messageType: "error", message: "Failed to load dashboard" });
    } finally {
      setLoading(false);
    }
  }, []);

  // Redirect to login if not authenticated
  // Else load the dashboard
  useEffect(() => {
    if (!auth.token) {
      router.replace("/org-login");
      return;
    }
    loadDashboard(auth.token);
  }, [auth.token, loadDashboard, router]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setAuth({ token: null, userId: null, email: null });
    setProfile(null);
  }

  async function handleSaveProfile() {
    if (!auth.token || !profile) return;

    setSaving(true);
    setMessage(null);

    try {
      const lat = latitude.trim() === "" ? null : Number(latitude);
      const lng = longitude.trim() === "" ? null : Number(longitude);

      // Check latitude and longitude
      if (
        (latitude.trim() !== "" && !Number.isFinite(lat)) ||
        (longitude.trim() !== "" && !Number.isFinite(lng))
      ) {
        setMessage({
          messageType: "error",
          message: "Latitude and longitude must be valid numbers.",
        });
        return;
      }

      const updated = await updateOrgProfile(auth.token, {
        name: profile.name,
        email: profile.email,
        branch_name: profile.branch_name,
        org_type: profile.org_type,
        description: profile.description,
        phones: cleanStringList(profile.phones),
        address: profile.address,
        website: profile.website,
        logo_url: profile.logo_url,
        cover_url: profile.cover_url,
        coverage_region: profile.coverage_region,
        coverage_areas: cleanStringList(profile.coverage_areas),
        responsibilities: cleanStringList(profile.responsibilities),
        keywords: cleanStringList(profile.keywords),
        reference_links: cleanStringList(profile.reference_links),
        compliance: cleanStringList(profile.compliance),
        laws: cleanStringList(profile.laws),
        geo:
          lat != null &&
          lng != null &&
          Number.isFinite(lat) &&
          Number.isFinite(lng)
            ? { lat, lng }
            : null,
      });

      setProfile(updated);

      const g = readGeoFromJson(updated.geo);
      setLatitude(g.lat === undefined ? "" : g.lat.toString());
      setLongitude(g.lng === undefined ? "" : g.lng.toString());

      setMessage({ messageType: "success", message: "Profile saved." });
    } catch (e) {
      setMessage({ messageType: "error", message: "Save failed" });
    } finally {
      setSaving(false);
    }
  }


  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        {/* Heading */}
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            Organisation profile
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

      {/* Message */}
      {message && <MessageBox {...message} />}

      {loading ? (
        <div className="text-center py-16 text-slate-500 text-sm">Loading…</div>

      ) : profile ? (
        <div className="space-y-4">
          {/* Cover + logo */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="h-36 bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profile.cover_url || "/org_background.png"}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/org_background.png";
                }}
              />
            </div>
            <div className="px-5 pb-5 -mt-10 flex items-end gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profile.logo_url || "/org_avatar.png"}
                alt=""
                className="w-20 h-20 rounded-xl border-2 border-white object-cover bg-slate-100 shadow"
                onError={(e) => {
                  e.currentTarget.src = "/org_avatar.png";
                }}
              />
              <div className="pb-1">
                <p className="font-semibold text-slate-800">{profile.name}</p>
                <p className="text-xs text-slate-500">
                  {profile.verified ? "Verified ⭐" : "Not verified ⭐"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <Field
              label="Name"
              value={profile.name}
              onChange={(v) => setProfile({ ...profile, name: v })}
            />

            <Field
              label="Email"
              value={profile.email}
              onChange={(v) => setProfile({ ...profile, email: v })}
            />

            <Field
              label="Branch name"
              value={profile.branch_name ?? ""}
              onChange={(v) =>
                setProfile({ ...profile, branch_name: v || null })
              }
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Organisation type
              </label>
              <select
                value={profile.org_type}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    org_type: e.target.value as OrgType,
                  })
                }
                className="input-base w-full"
              >
                  {
                    Object.values(OrgType).map((type) => (
                      <option key={type} value={type}>
                        {textToPascalCase(type)}
                      </option>
                    ))
                  }
              </select>
            </div>

            <Field
              label="Description"
              value={profile.description ?? ""}
              onChange={(v) =>
                setProfile({ ...profile, description: v || null })
              }
              textarea
            />

            <StringListInput
              label="Phones"
              values={profile.phones}
              onChange={(phones) => setProfile({ ...profile, phones })}
              placeholder="Phone number"
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
              label="Logo URL"
              value={profile.logo_url ?? ""}
              onChange={(v) => setProfile({ ...profile, logo_url: v || null })}
            />

            <Field
              label="Cover URL"
              value={profile.cover_url ?? ""}
              onChange={(v) => setProfile({ ...profile, cover_url: v || null })}
            />

            <Field
              label="Coverage region"
              value={profile.coverage_region ?? ""}
              onChange={(v) =>
                setProfile({ ...profile, coverage_region: v || null })
              }
            />

            <StringListInput
              label="Coverage areas"
              values={profile.coverage_areas}
              onChange={(coverage_areas) =>
                setProfile({ ...profile, coverage_areas })
              }
              placeholder="Area name"
            />

            <StringListInput
              label="Responsibilities"
              values={profile.responsibilities}
              onChange={(responsibilities) =>
                setProfile({ ...profile, responsibilities })
              }
              placeholder="Responsibility"
            />

            <StringListInput
              label="Keywords"
              values={profile.keywords}
              onChange={(keywords) => setProfile({ ...profile, keywords })}
              placeholder="Keyword"
            />

            <StringListInput
              label="Reference links"
              values={profile.reference_links}
              onChange={(reference_links) =>
                setProfile({ ...profile, reference_links })
              }
              placeholder="https://..."
            />

            <StringListInput
              label="Compliance"
              values={profile.compliance}
              onChange={(compliance) => setProfile({ ...profile, compliance })}
              placeholder="Compliance item"
            />

            <StringListInput
              label="Laws"
              values={profile.laws}
              onChange={(laws) => setProfile({ ...profile, laws })}
              placeholder="Law or regulation"
            />

            {/* Geo: only lat/lng editable */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="HQ Latitude" value={latitude} onChange={setLatitude} />
              <Field
                label="HQ Longitude"
                value={longitude}
                onChange={setLongitude}
              />
            </div>
            <p className="text-xs text-slate-500 -mt-2">
              Used to match nearby hazard reports. Example Colombo: 6.9271,
              79.8612
            </p>

            <OrgLocationMap latitude={latitude} longitude={longitude} />

            {/* Full geo JSON (read only) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Stored geo (read only)
              </label>
              <pre className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-x-auto text-slate-600">
                {profile.geo
                  ? JSON.stringify(profile.geo, null, 2)
                  : "No geo saved yet"}
              </pre>
            </div>

            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full py-2.5 bg-slate-800 text-white text-sm font-medium rounded-lg disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save profile"}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-slate-500 text-sm">
          No profile found.
        </div>
      )}
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
