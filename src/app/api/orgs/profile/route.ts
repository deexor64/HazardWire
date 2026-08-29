import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";
import { Geo } from "@/lib/types";

function supabaseUserClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
    },
  );
}

async function getUserId(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  const supabase = supabaseUserClient(token);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

export async function GET(req: NextRequest) {
  const user = await getUserId(req);
  if (!user) {
    return NextResponse.json(
      { status: false, result: "Unauthorized" },
      { status: 401 },
    );
  }

  const org = await prisma.organization.findUnique({ where: { id: user.id } });
  if (!org) {
    return NextResponse.json(
      { status: false, result: "Profile not found" },
      { status: 404 },
    );
  }
  return NextResponse.json({ status: true, result: org });
}

type BootstrapBody = {
  name?: string;
  email?: string;
};

/** Create org profile after Supabase signup (id = auth user id) */
export async function POST(req: NextRequest) {
  const user = await getUserId(req);
  if (!user) {
    return NextResponse.json(
      { status: false, result: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const body = (await req.json()) as BootstrapBody;
    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json(
        { status: false, result: "name is required" },
        { status: 400 },
      );
    }

    const existing = await prisma.organization.findUnique({
      where: { id: user.id },
    });
    if (existing) {
      return NextResponse.json({ status: true, result: existing });
    }

    const org = await prisma.organization.create({
      data: {
        id: user.id,
        email: user.email || body.email || "",
        name,
      },
    });

    return NextResponse.json({ status: true, result: org });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json(
      { status: false, result: message },
      { status: 500 },
    );
  }
}

type ProfileUpdateBody = {
  name?: string;
  branch_name?: string | null;
  description?: string | null;
  phones?: string[];
  address?: string | null;
  geo?: Geo | null
  website?: string | null;
  coverage_region?: string | null;
  coverage_areas?: string[];
  responsibilities?: string[];
  keywords?: string[];
};

export async function PUT(req: NextRequest) {
  const user = await getUserId(req);
  if (!user) {
    return NextResponse.json(
      { status: false, result: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const body = (await req.json()) as ProfileUpdateBody;

    const org = await prisma.organization.update({
      where: { id: user.id },
      data: {
        name: body.name,
        branch_name: body.branch_name,
        description: body.description,
        phones: body.phones,
        address: body.address,
        geo: body.geo === undefined ? undefined : body.geo as Geo,
        website: body.website,
        coverage_region: body.coverage_region,
        coverage_areas: body.coverage_areas,
        responsibilities: body.responsibilities,
        keywords: body.keywords,
      },
    });

    return NextResponse.json({ status: true, result: org });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json(
      { status: false, result: message },
      { status: 500 },
    );
  }
}
