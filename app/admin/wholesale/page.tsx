import { AdminShell } from "@/components/admin/AdminShell";
import { WholesaleOrdersAdminView } from "@/components/admin/WholesaleOrdersAdminView";

export const metadata = { title: "Wholesale Orders" };

export default function WholesaleOrdersPage() {
  return (
    <AdminShell title="Wholesale Orders">
      <WholesaleOrdersAdminView />
    </AdminShell>
  );
}
