import { NextRequest, NextResponse } from "next/server";
import { createHash, randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";
import type {
  Prisma,
  ReportCategory,
  ReportStatus,
} from "@/generated/prisma/client";

async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
    },
  );

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user.id;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const page = Number(sp.get("page") || 1);
  const pageSize = Number(sp.get("page_size") || 20);
  const status = sp.get("status") as ReportStatus | null;
  const category = sp.get("category") as ReportCategory | null;
  const assignedToMe = sp.get("assigned_to_me") === "true";

  const where: Prisma.ReportWhereInput = {};
  if (status) where.status = status;
  if (category) where.category = category;

  if (assignedToMe) {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json(
        { status: false, result: "Unauthorized" },
        { status: 401 },
      );
    }
    where.org_id = userId;
  }

  const [total, results] = await Promise.all([
    prisma.report.count({ where }),
    prisma.report.findMany({
      where,
      orderBy: { submitted_at: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        organization: { select: { id: true, name: true, branch_name: true } },
      },
    }),
  ]);

  return NextResponse.json({
    status: true,
    result: { total, page, page_size: pageSize, results },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json());
    const token = body.token || randomUUID();
    const public_token_hash = createHash("sha256").update(token).digest("hex");

    if (
      !body.title ||
      !body.description ||
      body.latitude == null ||
      body.longitude == null
    ) {
      return NextResponse.json(
        {
          status: false,
          result: "title, description, latitude, longitude required",
        },
        { status: 400 },
      );
    }

    const report = await prisma.report.create({
      data: {
        public_token_hash,
        title: body.title,
        description: body.description,
        latitude: body.latitude,
        longitude: body.longitude,
        contact_email: body.contact_email ?? null,
        contact_phone: body.contact_phone ?? null,
        raw_image_urls: body.raw_image_urls ?? body.image_urls ?? [],
        image_urls: body.image_urls ?? [],
        status: "PENDING",
        job: { create: { status: "pending" } },
      },
    });

    return NextResponse.json({
      status: true,
      result: { id: report.id, token, status: report.status },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json(
      { status: false, result: message },
      { status: 500 },
    );
  }
}
