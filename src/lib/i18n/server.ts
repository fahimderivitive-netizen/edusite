import { cookies } from 'next/headers';
import { dict, type Lang } from './dict';

export async function getLang(): Promise<Lang> {
  return (await cookies()).get('lang')?.value === 'en' ? 'en' : 'bn';
}

export async function getT() {
  const lang = await getLang();
  return { lang, t: dict[lang] };
}
