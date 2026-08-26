export type ReportCategory =
  | 'road' | 'drainage' | 'water' | 'electricity'
  | 'garbage' | 'environment' | 'animals' | 'accident' | 'crime' | 'other'

export type ReportSeverity = 'low' | 'medium' | 'high' | 'critical'
export type ReportStatus = 'pending' | 'assigned' | 'in_review' | 'resolved'

export interface Report {
  id: string
  title: string
  description: string
  category: ReportCategory
  severity: ReportSeverity
  status: ReportStatus
  authority: string | null
  latitude: number | null
  longitude: number | null
  media_urls: string[]
  contact_email?: string | null
  contact_phone?: string | null
  submitted_at: string
  updated_at: string
}

export interface ReportListResult {
  total: number
  page: number
  page_size: number
  results: Report[]
}

export interface ReportFilters {
  title?: string
  category?: ReportCategory
  severity?: ReportSeverity
  status?: ReportStatus
  authority?: string
  date_from?: string
  date_to?: string
  lattitude?: number
  longitude?: number
  radius_km?: number
  page?: number
  page_size?: number
}

export interface ReportSubmitBody {
  title: string
  description: string
  category: ReportCategory
  severity: ReportSeverity
  latitude?: number
  longitude?: number
  media_urls?: string[]
  contact_email?: string
  contact_phone?: string
}

export interface OrgProfile {
  id: string
  email: string
  name?: string | null
  authority_type?: string | null
  description?: string | null
  phone?: string | null
  address?: string | null
  website?: string | null
  verified?: boolean
}

export interface AuthState {
  token: string | null
  userId: string | null
  email: string | null
  profile: OrgProfile | null
}

export type View = 'map' | 'reports' | 'submit' | 'my-reports' | 'authorities' | 'orgs'
