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

export interface CreateProductInput {
  name: string;
  category: "PINCHO" | "BEBIDA";
  subCategory?: string;
  price: number;
  description?: string;
  imageUrl?: string;
  hasAccompaniments: boolean;
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

export async function createProduct(input: CreateProductInput) {
  try {
    if (!input.name.trim()) {
      return { success: false, error: "El nombre del producto es obligatorio" };
    }
    const numPrice = Number(input.price);
    if (isNaN(numPrice) || numPrice < 0) {
      return { success: false, error: "Ingresa un precio válido" };
    }

    const lastProduct = await prisma.product.findFirst({
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const nextSortOrder = (lastProduct?.sortOrder ?? 0) + 1;

    const fallbackImg = input.category === "PINCHO" 
      ? "/images/products/costilla-cerdo.png" 
      : "/images/products/coca-cola-personal.jpg";

    const product = await prisma.product.create({
      data: {
        name: input.name.trim(),
        category: input.category,
        subCategory: input.subCategory?.trim() || null,
        price: numPrice,
        description: input.description?.trim() || null,
        imageUrl: input.imageUrl?.trim() || fallbackImg,
        hasAccompaniments: input.category === "PINCHO" ? input.hasAccompaniments : false,
        sortOrder: nextSortOrder,
        isActive: true,
      },
    });

    safeRevalidatePath("/mesero");
    safeRevalidatePath("/admin");
    return { success: true, product };
  } catch (error) {
    console.error("Error al crear producto:", error);
    return { success: false, error: "No se pudo guardar el nuevo producto" };
  }
}
