// Course pictures live in the public Supabase bucket `course-thumbnails`.
export const thumbUrl = (path: string) =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/course-thumbnails/${path}`;
