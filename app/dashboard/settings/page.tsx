import { SettingsView } from "@/components/dashboard/views/settings-view";
import { currentIdentity } from "@/lib/server/workspace";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  return <SettingsView workspace={await currentIdentity()} />;
}
