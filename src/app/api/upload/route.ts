import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const BUCKET = 'images_raw'

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ status: false, result: 'file required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // server only
    )

    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg'
    const path = `${randomUUID()}.${safeExt}`

    const bytes = Buffer.from(await file.arrayBuffer())
    const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
      contentType: file.type || 'image/jpeg',
      upsert: false,
    })
    if (error) {
      return NextResponse.json({ status: false, result: error.message }, { status: 500 })
    }

    // Store path only; worker reads private bucket by path
    return NextResponse.json({ status: true, result: { path } })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Upload failed'
    return NextResponse.json({ status: false, result: message }, { status: 500 })
  }
}
