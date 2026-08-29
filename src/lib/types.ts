import { OrgType, Prisma, ReportCategory, ReportStatus } from "@/generated/prisma/client"

export type ReportFilters = {
  category?: ReportCategory;
  status?: ReportStatus;
  assigned_to_me?: boolean;
  page?: number;
  page_size?: number;
};

export type Geo = {
  lat?: number
  lng?: number
  display_name?: string
  city?: string
  state?: string
}

export type ReportListItem = Prisma.ReportGetPayload<{
  include: {
    organization: {
      select: { id: true; name: true; branch_name: true };
    };
  };
}>;

export type AnalysisJson = {
  summary?: string
  explanation?: string
  routing_reason?: string
  priority_score?: number
  image_tags?: string[]
  match_keywords?: string[]
  model?: string
  possible_duplicate?: boolean
  duplicates?: { id: string; title?: string; status?: string; distance_km?: number }[]
  retrieved_rules?: string[]
}


// export type ReportCardData = {
//   id: string;
//   title: string;
//   description: string;
//   status: ReportStatus;
//   category: ReportCategory | null;
//   priority: ReportPriority | null;
//   image_urls: string[];
//   raw_image_urls: string[];
//   submitted_at: Date | string;
// };

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

// export type ReportFilters = {
//   category?: ReportCategory;
//   status?: ReportStatus;
//   page?: number;
//   page_size?: number;
// };



export type ApiOk<T> = { status: true; result: T };
export type ApiErr = { status: false; result: string };
export type ApiResponse<T> = ApiOk<T> | ApiErr;

export type ReportSubmitInput = {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  token: string;
  contact_email?: string;
  contact_phone?: string;
  raw_image_urls?: string[];
  image_urls?: string[];
};

export type SubmitResult = {
  id: string;
  token: string;
  status: ReportStatus;
};


// export type AuthState = {
//   token: string | null;
//   userId: string | null;
//   email: string | null;
// };
