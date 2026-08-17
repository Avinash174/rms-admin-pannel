import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Warehouse Admin Login | Records Management System',
  description: 'Dedicated Warehouse Administrator access for RMS',
};

export default function WarehouseLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
