import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY

// Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Uploads a media file to Supabase storage
export async function uploadMedia(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
  const filePath = `reports/${fileName}`

  const { error } = await supabase.storage
    .from('reports_media')
    .upload(filePath, file, { cacheControl: '3600', upsert: false })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  const { data } = supabase.storage.from('reports_media').getPublicUrl(filePath)
  return data.publicUrl
}
