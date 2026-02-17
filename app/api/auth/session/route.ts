import { NextRequest } from "next/server";
import { decryptCookie } from "@/app/lib/cookies";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
    const cookies = request.cookies;
    const sessionCookie = cookies.get("session")?.value;
    const decrypted = decryptCookie(sessionCookie || "");
    if (!sessionCookie || !decrypted) {
        return new Response(JSON.stringify({ error: "No session cookie or decryption failed" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
        });
    }

    const sessionData = JSON.parse(decrypted);
    console.log(sessionData);
    return new Response(JSON.stringify({ session: sessionData }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });

}