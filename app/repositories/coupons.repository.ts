import pool from "@/app/lib/database/MySql";
import { RowDataPacket } from "mysql2";

interface CreateMultipleCouponsParams {
  outlet: string;
  kasirID: string;
  trx: string;
  date: Date;
  customer: string;
  address: string;
  phone: string;
  totalCoupon: number;
}

export class CouponRepository {
  static async findByTrx(trx: string, outlet: string) {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM coupons WHERE trx = ? AND outlet = ? ",
      [trx, outlet],
    );
    return rows;
  }

  static async findByOutletAndKasir(outlet: string, kasirID: string) {
    console.log("Outlet:", outlet, "Kasir ID:", kasirID);
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM coupons WHERE outlet = ? AND kasir_id = ?",
      [outlet, kasirID],
    );
    return rows;
  }

  static async createMultipleCoupons(data: CreateMultipleCouponsParams) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 🔒 1. Lock transaksi supaya tidak double generate
      const [existing]: any = await connection.query(
        `SELECT id FROM coupons WHERE trx = ? AND outlet = ? LIMIT 1 FOR UPDATE`,
        [data.trx, data.outlet]
      );

      if (existing.length > 0) {
        throw new Error("Transaksi sudah pernah generate kupon");
      }

      // 🔒 2. Lock nomor terakhir outlet
      const [rows]: any = await connection.query(
        `
        SELECT coupon_number
        FROM coupons
        WHERE outlet = ?
        ORDER BY id DESC
        LIMIT 1
        FOR UPDATE
        `,
        [data.outlet]
      );

      let nextNumber = 1;

      if (rows.length > 0) {
        const lastRunning = parseInt(rows[0].coupon_number.split("-")[1]);
        nextNumber = lastRunning + 1;
      }

      if (nextNumber + data.totalCoupon - 1 > 100000) {
        throw new Error("Coupon limit 100000 exceeded for this outlet");
      }

      const insertedCoupons: string[] = [];

      for (let i = 0; i < data.totalCoupon; i++) {
        const running = String(nextNumber + i).padStart(6, "0");
        const couponNumber = `${data.outlet}-${running}`;

        await connection.query(
          `
          INSERT INTO coupons
          (coupon_number, outlet, date, kasir_id, trx, customer, phone, address, is_print, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())
          `,
          [
            couponNumber,
            data.outlet,
            data.date,
            data.kasirID,
            data.trx,
            data.customer,
            data.phone,
            data.address,
          ]
        );

        insertedCoupons.push(couponNumber);
      }

      await connection.commit();

      return insertedCoupons;

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
