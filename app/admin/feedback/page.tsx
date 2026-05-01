import { AdminShell } from "@/components/admin/AdminShell";
import { FeedbackView } from "@/components/admin/FeedbackView";

export const metadata = { title: "Feedback — DFS Admin" };

export default function FeedbackPage() {
  return (
    <AdminShell title="Design Feedback">
      <FeedbackView />
    </AdminShell>
  );
}
