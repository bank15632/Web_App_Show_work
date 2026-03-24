"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle } from "lucide-react";

export function PinEntry() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";

  const [digits, setDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError("");

    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    if (next.every((d) => d !== "")) {
      void submitPin(next.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (pasted.length === 0) return;

    const next = [...digits];
    for (let i = 0; i < 4; i++) {
      next[i] = pasted[i] || "";
    }
    setDigits(next);
    setError("");

    if (pasted.length === 4) {
      void submitPin(pasted);
    } else {
      inputRefs.current[Math.min(pasted.length, 3)]?.focus();
    }
  }

  async function submitPin(pin: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      if (res.ok) {
        router.replace(nextPath);
      } else {
        setError("PIN ไม่ถูกต้อง");
        setDigits(["", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError("เกิดข้อผิดพลาด ลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-xs space-y-8 text-center">
        <div className="space-y-2">
          <img
            src="/logo-bnj.svg"
            alt="BNJ"
            width={80}
            height={40}
            className="mx-auto h-10 w-auto"
          />
          <h1 className="text-lg font-medium">กรุณาใส่ PIN</h1>
          <p className="text-sm text-muted-foreground">กรอกรหัส 4 หลักเพื่อเข้าสู่ระบบ</p>
        </div>

        <div className="flex justify-center gap-3" onPaste={handlePaste}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              autoFocus={i === 0}
              disabled={loading}
              className="h-14 w-14 rounded-xl border-2 border-border bg-transparent text-center text-2xl font-semibold outline-none transition-colors focus:border-foreground disabled:opacity-50"
            />
          ))}
        </div>

        <div className="h-6">
          {loading ? (
            <LoaderCircle className="mx-auto size-5 animate-spin text-muted-foreground" />
          ) : error ? (
            <p className="text-sm font-medium text-red-500">{error}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
