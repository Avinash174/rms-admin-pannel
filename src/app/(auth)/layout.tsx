import { SidebarWrapper } from "@/components/sidebar-wrapper";
import { AuthGuard } from "@/components/auth-guard";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <SidebarWrapper>{children}</SidebarWrapper>
    </AuthGuard>
  );
}
