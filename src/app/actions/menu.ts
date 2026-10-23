"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignorar fuera de contexto HTTP
  }
}

export async function getActiveMenuProducts() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: [
        { category: "asc" },
        { sortOrder: "asc" },
      ],
    });
    return products;
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return [];
  }
}

export async function toggleProductActive(productId: string, currentState: boolean) {
  try {
    const updated = await prisma.product.update({
      where: { id: productId },
      data: { isActive: !currentState },
    });
    safeRevalidatePath("/mesero");
    safeRevalidatePath("/admin");
    return { success: true, product: updated };
  } catch (error) {
    console.error("Error al cambiar estado de producto:", error);
    return { success: false, error: "No se pudo actualizar el producto" };
  }
}
