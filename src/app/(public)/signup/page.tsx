import AuthForm from '@/components/ui/AuthForm'
import { getLang } from '@/lib/i18n/server'

export default async function Page() {
  return <AuthForm mode="signup" lang={await getLang()} />
}
