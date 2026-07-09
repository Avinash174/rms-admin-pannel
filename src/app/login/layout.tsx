import type { Metadata } from "next";
import { Providers } from "../providers";

export const metadata: Metadata = {
  title: "Login - Enterprise RMS Admin",
  description: "Sign in to your Enterprise RMS account",
};

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Providers>
      {children}
    </Providers>
  );
}
