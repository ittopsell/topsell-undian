"use server";

import { cookies } from "next/headers";
import { encryptCookie } from "../lib/cookies";
import { logger } from "../lib/logger";

export async function signinAction(prevState: any, formData: FormData) {
  const passkey = formData.get("passkey") as string;

  if (!passkey) return { error: "Passkey is required" };

  try {
    const res = await fetch(
      `${process.env.API_URL}/api/auth/signin`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passkey }),
        cache: "no-store",
      }
    );

    const result = await res.json();
    console.log(result);

    if (result.error) {
      logger.error("Signin failed:", result);
      return { error: result.error || "Login failed" };
    }

    if (!res.ok || result.error) {
      logger.error("Signin failed:", result);
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

    logger.info(encrypted);

    (await cookies()).set("session", encrypted, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    console.log("✅ Signed in");

    return { success: true };
  } catch (err: any) {
    logger.error("Signin failed:", err);
    return { error: err.message };
  }
}
