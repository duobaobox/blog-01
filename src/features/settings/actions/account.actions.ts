"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/infrastructure/auth";
import { db } from "@/infrastructure/db";

export async function updateAdminProfile(input: { name: string }) {
  const session = await requireAdminSession();

  const name = input.name.trim();

  if (!name) {
    throw new Error("昵称不能为空");
  }

  await db.user.update({
    where: { id: session.user.id },
    data: {
      name,
    },
  });

  revalidatePath("/admin/account");
  revalidatePath("/admin");

  return { name };
}
