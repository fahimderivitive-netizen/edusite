import { ResetForm } from '@/components/ui/PasswordForms';
import { getLang } from '@/lib/i18n/server';
export const instant = false;

export default async function Page() {
  return <ResetForm lang={await getLang()} />;
}
