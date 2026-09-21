"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { checkAuth, consumeSessionExpired, useAuthState } from "@/lib/admin/auth";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  const auth = useAuthState();
  const router = useRouter();

  useEffect(() => {
    if (auth.status === "unknown") {
      checkAuth();
    } else if (auth.status === "guest") {
      router.replace(consumeSessionExpired() ? "/login?expired=1" : "/");
    }
  }, [auth.status, router]);

  if (auth.status !== "authenticated") {
    return null;
  }

  return <div>{children}</div>;
}
