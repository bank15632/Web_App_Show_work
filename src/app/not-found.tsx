import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { outlineLinkClass, primaryLinkClass } from "@/lib/portal-styles";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-12">
      <Card className="w-full border-border/70 bg-card/90">
        <CardHeader>
          <CardDescription>404</CardDescription>
          <CardTitle className="font-display text-4xl">
            ไม่พบหน้าที่คุณกำลังหา
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Link href="/" className={primaryLinkClass}>
            กลับหน้า overview
          </Link>
          <Link href="/studio" className={outlineLinkClass}>
            เข้า workflow dashboard
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
