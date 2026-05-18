import { AdminShell } from "@/components/admin/AdminShell";
import { WholesaleAccountsView } from "@/components/admin/WholesaleAccountsView";

export const metadata = { title: "Wholesale Accounts" };

export default function WholesaleAccountsPage() {
  return (
    <AdminShell title="Wholesale Accounts">
      <WholesaleAccountsView />
    </AdminShell>
  );
}
