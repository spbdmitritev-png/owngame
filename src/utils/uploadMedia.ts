import { supabase } from '../lib/supabase'

export async function uploadMedia(file: File) {
  const ext = file.name.split('.').pop()
  const fileName = `${crypto.randomUUID()}.${ext}`

  const folder =
    file.type.startsWith('image') ? 'images'
    : file.type.startsWith('audio') ? 'audio'
    : file.type.startsWith('video') ? 'video'
    : 'other'

  const filePath = `${folder}/${fileName}`

  const { error } = await supabase.storage
    .from('media')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    throw error
  }

  const { data } = supabase.storage
    .from('media')
    .getPublicUrl(filePath)

  return {
    media_url: data.publicUrl,
    media_type: file.type.startsWith('image')
      ? 'image'
      : file.type.startsWith('audio')
      ? 'audio'
      : file.type.startsWith('video')
      ? 'video'
      : 'unknown',
  }
}
