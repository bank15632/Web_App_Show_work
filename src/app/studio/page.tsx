"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StudioRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">กำลังไปหน้า dashboard...</p>
    </div>
  );
}
