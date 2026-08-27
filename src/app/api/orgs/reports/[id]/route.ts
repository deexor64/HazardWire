import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'
import type { ReportStatus } from '@/generated/prisma/client'

async function getUser(req: NextRequest) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) return null
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return null
  return data.user
}

type PatchBody = {
  status?: ReportStatus
  comment?: string
  /** Delete comment at this index */
  delete_comment_index?: number
  /** Reassign to another organization id */
  org_id?: string
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser(req)
  if (!user) {
    return NextResponse.json({ status: false, result: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = (await req.json()) as PatchBody

  // Must currently be assigned to the caller
  const existing = await prisma.report.findFirst({
    where: { id, org_id: user.id },
  })
  if (!existing) {
    return NextResponse.json({ status: false, result: 'Report not found' }, { status: 404 })
  }

  let comments = [...existing.comments]
  let org_id = existing.org_id
  let status = body.status ?? existing.status

  if (typeof body.delete_comment_index === 'number') {
    const i = body.delete_comment_index
    if (i < 0 || i >= comments.length) {
      return NextResponse.json(
        { status: false, result: 'Invalid comment index' },
        { status: 400 }
      )
    }
    comments = comments.filter((_, idx) => idx !== i)
  }

  if (body.comment?.trim()) {
    comments = [...comments, body.comment.trim()]
  }

  if (body.org_id && body.org_id !== user.id) {
    const target = await prisma.organization.findUnique({
      where: { id: body.org_id },
      select: { id: true },
    })
    if (!target) {
      return NextResponse.json(
        { status: false, result: 'Target organization not found' },
        { status: 400 }
      )
    }
    org_id = body.org_id
    // Keep ASSIGNED when handing off
    if (!body.status) status = 'ASSIGNED'
  }

  const report = await prisma.report.update({
    where: { id },
    data: {
      status,
      comments,
      org_id,
    },
    include: {
      organization: { select: { id: true, name: true, branch_name: true } },
    },
  })

  return NextResponse.json({ status: true, result: report })
}
