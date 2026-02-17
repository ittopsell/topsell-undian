import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, testConnection } from '@/app/lib/database/SqlServer';
import { decryptCookie } from '@/app/lib/cookies';
import { findByOutletAndKasir, createMultipleCoupons } from '@/app/services/coupon.service';
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
    try {
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
        const outlet = sessionData.outlet || 'MK01';
        const coupons = await findByOutletAndKasir(sessionData.outlet, sessionData.kode);
        const exclTrx = coupons.map(c => c.trx);
        console.log(exclTrx);

        // Test connection first
        const isConnected = await testConnection(outlet);
        if (!isConnected) {
            return NextResponse.json(
                { error: `Failed to connect to database: ${outlet}` },
                { status: 503 }
            );
        }

        // Execute query
        const transaction = await executeQuery(
            outlet,
            `SELECT GT2026.NoTrans as id, Tanggal AS date, GT2026.Waktu as time, Netto as amount, pelanggan AS customer, alamat AS address FROM GT2026
            INNER JOIN GI2026 ON GT2026.NoTrans = GI2026.NoTrans
            INNER JOIN Sorderts ON GI2026.Noso = Sorderts.NoTrans
            WHERE kasirID=@param0 AND Tanggal BETWEEN @param1 AND @param2 AND Netto >= 1000000 AND noso !='' AND GT2026.NoTrans NOT IN (${exclTrx.length > 0 ? exclTrx.map(x => `'${x}'`).join(",") : "''"}) ORDER BY GT2026.NoTrans DESC`,
            [sessionData.kode, new Date(new Date().setHours(0, 0, 0, 0)), new Date(new Date().setHours(23, 59, 59, 999))]
        );

        return NextResponse.json({
            outlet,
            count: transaction.length,
            data: transaction
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}


export async function POST(request: NextRequest) {
  try {
    const cookies = request.cookies;
    const sessionCookie = cookies.get("session")?.value;
    const decrypted = decryptCookie(sessionCookie || "");

    if (!sessionCookie || !decrypted) {
      return NextResponse.json(
        { error: "No session cookie or decryption failed" },
        { status: 401 }
      );
    }

    const sessionData = JSON.parse(decrypted);
    const outlet = sessionData.outlet;

    const body = await request.json();
    const { noTrans } = body;

    if (!noTrans) {
      return NextResponse.json(
        { error: "NoTrans wajib diisi" },
        { status: 400 }
      );
    }

    // cek koneksi SQL Server
    const isConnected = await testConnection(outlet);
    if (!isConnected) {
      return NextResponse.json(
        { error: `Failed to connect to database: ${outlet}` },
        { status: 503 }
      );
    }

    // ambil transaksi
    const transaction = await executeQuery(
      outlet,
      `
      SELECT GT2026.NoTrans as id,
             Tanggal AS date,
             GT2026.Waktu as time,
             Netto as amount,
             pelanggan AS customer,
             alamat AS address,
             ponsel AS phone
      FROM GT2026
      INNER JOIN GI2026 ON GT2026.NoTrans = GI2026.NoTrans
      INNER JOIN Sorderts ON GI2026.Noso = Sorderts.NoTrans
      WHERE GT2026.NoTrans=@param0
      `,
      [noTrans]
    );

    if (transaction.length === 0) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan" },
        { status: 404 }
      );
    }

    // 🔥 RULE: 1 juta = 1 kupon
    const countCoupon = Math.floor(transaction[0].amount / 1000000);

    if (countCoupon <= 0) {
      return NextResponse.json(
        { error: "Transaksi tidak memenuhi syarat kupon" },
        { status: 400 }
      );
    }

    const coupons = await createMultipleCoupons(
      outlet,
      sessionData.kode,
      transaction[0].id,
      transaction[0].date,
      transaction[0].customer,
      transaction[0].address,
      transaction[0].phone,
      countCoupon
    );

    return NextResponse.json({
      status: "ok",
      total: coupons.length,
      data: coupons,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
