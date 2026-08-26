import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";
import type { ReportStatus } from "@/generated/prisma/client";

async function getUser(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser(req);
  if (!user) {
    return NextResponse.json(
      { status: false, result: "Unauthorized" },
      { status: 401 },
    );
  }

  const { id } = await params;
  const body = (await req.json()) as {
    status?: ReportStatus;
    comment?: string;
  };

  const existing = await prisma.report.findFirst({
    where: { id, org_id: user.id },
  });
  if (!existing) {
    return NextResponse.json(
      { status: false, result: "Report not found" },
      { status: 404 },
    );
  }

  const comments = body.comment
    ? [...existing.comments, body.comment]
    : existing.comments;

  const report = await prisma.report.update({
    where: { id },
    data: {
      status: body.status ?? existing.status,
      comments,
    },
  });

  return NextResponse.json({ status: true, result: report });
}
