"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";


export async function logoutAction() {
  try {
    const cookieStore = await cookies();

    cookieStore.delete("session");

    

  } catch (err: any) {
    console.log(err);
  }

  redirect("/signin");
}