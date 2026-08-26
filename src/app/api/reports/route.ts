import { NextRequest, NextResponse } from "next/server";
import { createHash, randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import type {
  Prisma,
  ReportCategory,
  ReportStatus,
} from "@/generated/prisma/client";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const page = Number(sp.get("page") || 1);
  const pageSize = Number(sp.get("page_size") || 20);
  const status = sp.get("status") as ReportStatus | null;
  const category = sp.get("category") as ReportCategory | null;

  const where: Prisma.ReportWhereInput = {};
  if (status) where.status = status;
  if (category) where.category = category;

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

type CreateBody = {
  title?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  token?: string;
  contact_email?: string;
  contact_phone?: string;
  raw_image_urls?: string[];
  image_urls?: string[];
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateBody;
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
