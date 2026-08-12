import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - RMS Admin",
  description: "Sign in to RMS Records Management System",
};

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
