import { CouponRepository } from "../repositories/coupons.repository";


export const findByTrx = (trx: string, outlet: string) =>
  CouponRepository.findByTrx(trx, outlet);

export const findByOutletAndKasir = (outlet: string, kasirID: string) =>
  CouponRepository.findByOutletAndKasir(outlet, kasirID);


export async function createMultipleCoupons(
  outlet: string,
  kasirID: string,
  trx: string,
  date: Date,
  customer: string,
  address: string,
  phone: string,
  totalCoupon: number
) {
  return CouponRepository.createMultipleCoupons({
    outlet,
    kasirID,
    trx,
    date,
    customer,
    address,
    phone,
    totalCoupon,
  });
}

