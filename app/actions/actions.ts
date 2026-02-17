"use server";

import { cookies } from "next/headers";
import { encryptCookie } from "../lib/cookies";

export async function signinAction(prevState: any, formData: FormData) {
  const passkey = formData.get("passkey") as string;

  if (!passkey) return { error: "Passkey is required" };

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/signin`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passkey }),
        cache: "no-store",
      }
    );

    const result = await res.json();

    if (!res.ok || result.error) {
      return { error: result.error || "Login failed" };
    }

    // ✅ Encrypt cookie
    const encrypted = encryptCookie(
      JSON.stringify({
        kode: result.kode,
        nama: result.nama,
        outlet: result.outlet,
      })
    );

    (await cookies()).set("session", encrypted, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}
