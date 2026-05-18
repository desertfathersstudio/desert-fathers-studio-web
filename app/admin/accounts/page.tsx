import { AdminShell } from "@/components/admin/AdminShell";
import { WholesaleAccountsView } from "@/components/admin/WholesaleAccountsView";
import { AdminErrorBoundary } from "@/components/admin/AdminErrorBoundary";

export const metadata = { title: "Wholesale Accounts" };

export default function WholesaleAccountsPage() {
  return (
    <AdminShell title="Wholesale Accounts">
      <AdminErrorBoundary>
        <WholesaleAccountsView />
      </AdminErrorBoundary>
    </AdminShell>
  );
}
