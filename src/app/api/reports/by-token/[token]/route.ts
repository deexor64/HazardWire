import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const hash = createHash("sha256").update(token).digest("hex");

  const report = await prisma.report.findUnique({
    where: { public_token_hash: hash },
    include: {
      organization: { select: { id: true, name: true, branch_name: true } },
    },
  });

  if (!report) {
    return NextResponse.json(
      { status: false, result: "Report not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ status: true, result: report });
}
