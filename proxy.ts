// export const runtime = "nodejs";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decryptCookie } from "./app/lib/cookies";

export function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get("session")?.value;

  let session = null;

  if (sessionCookie) {
    try {
      const decrypted = decryptCookie(sessionCookie);
      session = JSON.parse(decrypted);
    } catch (err) {
      console.error("Invalid session cookie", err);
    }
  }

  const pathname = request.nextUrl.pathname;

  // Kalau user sudah login, jangan bisa ke signin
  if (session && pathname === "/signin") {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // Proteksi semua halaman kecuali signin
  const protectedPaths = ["/", "/home"];
  const isProtected = protectedPaths.some(p => pathname === p || pathname.startsWith(p + "/"));

  if (!session && isProtected) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/home/:path*", "/signin"]
};
