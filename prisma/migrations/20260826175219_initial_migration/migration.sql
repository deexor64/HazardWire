-- CreateEnum
CREATE TYPE "ReportCategory" AS ENUM ('ROAD', 'WATER', 'IRRIGATION', 'GARBAGE', 'ENVIRONMENT', 'ACCIDENT', 'CONSTRUCTION', 'CRIME', 'GENERAL');

-- CreateEnum
CREATE TYPE "ReportPriority" AS ENUM ('UNKNOWN', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "OrgType" AS ENUM ('GOVERNMENT', 'NON_GOVERNMENT');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "branch_name" TEXT,
    "org_type" "OrgType" NOT NULL DEFAULT 'NON_GOVERNMENT',
    "description" TEXT,
    "phones" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "address" TEXT,
    "geo" JSONB,
    "website" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "logo_url" TEXT,
    "cover_url" TEXT,
    "coverage_region" TEXT,
    "coverage_areas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "responsibilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reference_links" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "compliance" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "laws" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "public_token_hash" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "category" "ReportCategory",
    "priority" "ReportPriority",
    "geo" JSONB,
    "analysis" JSONB,
    "raw_image_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "image_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "comments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "org_id" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_email_key" ON "organizations"("email");

-- CreateIndex
CREATE UNIQUE INDEX "reports_public_token_hash_key" ON "reports"("public_token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_report_id_key" ON "jobs"("report_id");

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
