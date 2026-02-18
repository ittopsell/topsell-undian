"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { signinAction } from "@/app/actions/actions";
import Image from "next/image";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 rounded-xl
        bg-linear-to-r from-blue-600 to-indigo-600
        hover:from-blue-700 hover:to-indigo-700
        text-white font-medium tracking-wide
        shadow-lg shadow-blue-500/30
        transition-all duration-300
        active:scale-[0.98]
        disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? "Signing in..." : "Sign In"}
    </button>
  );
}

export default function Signin() {
  const [showPassword, setShowPassword] = useState(false);

  const [state, formAction] = useFormState(signinAction, null);

  useEffect(() => {
  if (state?.success) {
    window.location.href = "/";
  }
}, [state]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4
      bg-linear-to-br from-slate-100 via-zinc-50 to-slate-200
      dark:from-slate-950 dark:via-slate-900 dark:to-black"
    >
      <div className="w-full max-w-md">
        <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80
          border border-slate-200 dark:border-slate-700
          shadow-xl shadow-slate-300/40 dark:shadow-black/40
          rounded-3xl p-8">

          <div className="flex justify-center mb-8">
            <Image
              src="/logo/logo-topsell-red.png"
              alt="Logo"
              width={120}
              height={40}
              priority
            />
          </div>

          <h1 className="text-3xl font-semibold text-center text-slate-800 dark:text-white">
            Welcome Back
          </h1>

          <form action={formAction} className="mt-10 space-y-6">

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Passkey
              </label>

              <div className="relative">
                <input
                  name="passkey"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter passkey"
                  className="w-full rounded-xl border
                    border-slate-300 dark:border-slate-700
                    bg-white dark:bg-slate-800
                    text-slate-900 dark:text-white
                    px-4 py-3 pr-10
                    focus:ring-2 focus:ring-blue-500
                    outline-none"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                    text-slate-400 hover:text-slate-600
                    dark:hover:text-slate-200 transition"
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {state?.error && (
              <div className="text-sm text-red-500 bg-red-50
                dark:bg-red-900/30 dark:text-red-400
                px-4 py-2 rounded-lg">
                {state.error}
              </div>
            )}

            <SubmitButton />
          </form>
        </div>
      </div>
    </div>
  );
}
