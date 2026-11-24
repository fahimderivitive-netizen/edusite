import AuthForm from '@/components/ui/AuthForm'
import { getLang } from '@/lib/i18n/server'
export const instant = false

export default async function Page() {
  return <AuthForm mode="login" lang={await getLang()} />
}
