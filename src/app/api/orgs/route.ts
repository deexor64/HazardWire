import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const orgs = await prisma.organization.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      branch_name: true,
      org_type: true,
      verified: true,
      phones: true,
      coverage_region: true,
      description: true,
      website: true,
      address: true,
      logo_url: true,
      responsibilities: true,
    },
  });

  return NextResponse.json({ status: true, result: orgs });
}
