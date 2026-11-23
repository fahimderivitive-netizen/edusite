'use server';
import { cookies } from 'next/headers';

export async function setLang(lang: string) {
  if (lang !== 'bn' && lang !== 'en') return;
  (await cookies()).set('lang', lang, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
}
