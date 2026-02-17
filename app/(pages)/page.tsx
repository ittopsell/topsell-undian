"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { PrinterIcon, ArrowPathIcon  } from "@heroicons/react/24/outline"; // pakai heroicons
import Swal from "sweetalert2";

interface Transaction {
  id: number;
  amount: number;
  date: string;
  time: string;
  customer: string;
  address: string;
}

interface Session {
  kode: string;
  nama: string;
  outlet: string;
}



function formatDate(dateStr: string) {
  const date = new Date(dateStr);

const day = String(date.getUTCDate()).padStart(2, "0");
const month = String(date.getUTCMonth() + 1).padStart(2, "0");
const year = date.getUTCFullYear();

const hours = String(date.getUTCHours()).padStart(2, "0");
const minutes = String(date.getUTCMinutes()).padStart(2, "0");
const seconds = String(date.getUTCSeconds()).padStart(2, "0");

return `${day}-${month}-${year} | ${hours}:${minutes}:${seconds}`;
}

function toTitleCase(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .split(" ")  // Pisahkan kata berdasarkan spasi
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())  // Ubah huruf pertama menjadi kapital dan sisanya menjadi kecil
    .join(" ");  // Gabungkan kata-kata kembali
}


export default function RootPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  
  const handleThermalPrint = (
  couponNumbers: string[],
  txn: Transaction
) => {
  const printWindow = window.open("", "", "width=300,height=600");
  if (!printWindow) return;

  const content = `
    <html>
      <head>
        <title>Print Coupon</title>
        <style>
          @page {
            margin: 0;
          }

          body {
            font-family: monospace;
            width: 280px;
            padding: 10px;
            text-align: center;
          }

          .coupon {
            margin-bottom: 5mm; /* 🔥 jarak antar kupon */
          }

          .title {
            font-size: 16px;
            font-weight: bold;
          }

          .subtitle {
            font-size: 14px;
            margin-bottom: 8px;
          }

          .divider {
            border-top: 1px dashed #000;
            margin: 8px 0;
          }

          .number {
            font-size: 28px;
            font-weight: bold;
            margin: 12px 0;
          }

          .info {
            font-size: 14px;
            margin-bottom: 10px;
          }

          .footer {
            font-size: 13px;
            margin-top: 8px;
          }
        </style>
      </head>
      <body>

        ${couponNumbers.map(c => `
          <div class="coupon">

            <div class="title">KUPON UNDIAN</div>
            <div class="subtitle">TOPSELL E-BIKE</div>

            <div class="divider"></div>

            <div class="number">${c}</div>

            <div class="info">
              ${txn.customer || "-"} | ${txn.address || "-"}
            </div>

            <div class="divider"></div>

            <div class="footer">
              Pengundian dilaksanakan tanggal<br/>
              5 Mei 2026
            </div>

          </div>
        `).join("")}

      </body>
    </html>
  `;

  printWindow.document.write(content);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
};
   const getCoupons = async () => {
    try {
      const res = await fetch("/api/coupons", { cache: "no-store" });
      const data = await res.json();
      setTransactions(data.data || []);
      console.log("Coupons:", data);
    } catch (err) {
      console.error("Failed to fetch coupons:", err);
    }
  }

  const fetchSession = async () => {
  try {
    const res = await fetch("/api/auth/session", { cache: "no-store" });
    const data = await res.json();
    if (data.session) {
      setSession(data.session);
    }
  } catch (err) {
    console.error("Failed to fetch session:", err);
  }
};

  const handlePrint = async (txn: Transaction) => {

  const result = await Swal.fire({
    title: "Cetak Kupon?",
    html: `
      <p>Kupon hanya bisa dicetak <b>1 kali</b>.</p>
      <p>Apakah yakin ingin mencetak?</p>
    `,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ya, Cetak",
    cancelButtonText: "Batal",
    confirmButtonColor: "#16a34a",
    cancelButtonColor: "#dc2626",
    reverseButtons: true,
  });

  if (!result.isConfirmed) return;

  try {
    Swal.fire({
      title: "Memproses...",
      text: "Sedang generate kupon",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const res = await fetch("/api/coupons", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        noTrans: txn.id,
      }),
    });

    const data = await res.json();

    Swal.close();

    if (!res.ok) {
      Swal.fire("Gagal", data.error, "error");
      return;
    }

    // 🔥 Print
    handleThermalPrint(data.data, txn);

    // refresh list
    getCoupons();

    Swal.fire({
      icon: "success",
      title: "Berhasil",
      text: "Kupon berhasil dicetak",
      timer: 1500,
      showConfirmButton: false,
    });

  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Terjadi kesalahan saat mencetak", "error");
  }
};


  useEffect(() => {
  getCoupons();
  fetchSession();
  }, []);


  return (
    <div className="min-h-screen font-sans bg-linear-to-br from-[#84fab0] to-[#8fd3f4] dark:from-gray-900 dark:to-black">
      {/* Header */}
      <header className="w-full bg-white dark:bg-slate-900 shadow-md py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-center">
          <Image
            src="/logo/logo-topsell-red.png"
            alt="Logo"
            width={120}
            height={40}
            priority
          />
        </div>
      </header>

      {/* Main */}
      <main className="flex flex-col items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl space-y-6">
          {/* Welcome Card */}
          <div className="p-6 sm:p-8 flex flex-row justify-between bg-white dark:bg-slate-800 rounded-2xl shadow-md transition-all duration-500 hover:shadow-lg">
            <div>

              <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
                Welcome, { toTitleCase(session?.nama) }!
              </h1>
              <p className="mt-1 text-xs sm:text-base text-slate-700 dark:text-gray-300">
                Outlet: {session?.outlet}
              </p>
            </div>
            <div>

             <button
              onClick={getCoupons}
              className="mt-4 px-10 flex items-center justify-center gap-2 py-2 rounded-xl
                      bg-linear-to-r from-blue-600 to-indigo-600
                      hover:from-blue-700 hover:to-indigo-700
                      text-white font-medium tracking-wide
                      shadow-lg shadow-blue-500/30
                      transition-all duration-300
                      active:scale-[0.97]
                      disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowPathIcon className="w-5 h-5"/>
              Refresh
            </button>
            </div>
          </div>

          {/* Last Transaction Card */}
          {transactions && transactions.length > 0 ? (
            <div>
              { transactions.map((txn) => (
                <div key={txn.id} className="p-6 my-2 sm:p-8 bg-blue-50 dark:bg-gray-700 rounded-2xl shadow-md transition-all duration-500 hover:shadow-lg grid grid-cols-4 gap-4">
                  <div className="border-r px-4 border-gray-300 dark:border-gray-500">
                    <h1 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {txn.id}
                    </h1>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {formatDate(txn.time)}
                    </p>
                  </div>

                  <div className="border-r px-4 border-gray-300 dark:border-gray-500">
                    <h1 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {toTitleCase(txn.customer)}
                    </h1>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {toTitleCase(txn.address)}
                    </p>
                  </div>
                   <div className="border-r px-4 border-gray-300 dark:border-gray-500">
                    <h1 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Rp. {txn.amount.toLocaleString('id-ID')}
                    </h1>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        {/* Jumlah kupon bisa dihitung berdasarkan jumlah transaksi */}
                        {Math.floor(txn.amount / 1000000)} Kupon
                    </p>
                  </div>
                  <div className="px-4 flex items-center justify-center">
                    <button
                      onClick={() => handlePrint(txn)}
                      disabled={loadingId === txn.id}
                      className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-xl
                      bg-linear-to-r from-blue-600 to-indigo-600
                      hover:from-blue-700 hover:to-indigo-700
                      text-white font-medium tracking-wide
                      shadow-lg shadow-blue-500/30
                      transition-all duration-300
                      active:scale-[0.97]
                      disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <PrinterIcon className="w-5 h-5" />
                      {loadingId === txn.id ? "Memproses..." : "Cetak"}
                    </button>
                  </div>
                </div>
              )) }
            </div>
          ) : (
            
            <div className="p-6 sm:p-8 bg-blue-50 dark:bg-gray-700 rounded-2xl shadow-md transition-all duration-500 hover:shadow-lg">
              <p className="mt-6 text-sm sm:text-base text-slate-700 dark:text-gray-300 text-center">
                Belum ada transaksi.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
