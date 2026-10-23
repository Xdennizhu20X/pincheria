"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export interface CreateOrderItemInput {
  productId?: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  accompaniment?: string;
  notes?: string;
}

export interface CreateOrderInput {
  customerName: string;
  tableNumber?: string;
  waiterName?: string;
  notes?: string;
  items: CreateOrderItemInput[];
}

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignorar fuera de contexto HTTP de Next.js
  }
}

export async function createOrder(input: CreateOrderInput) {
  try {
    if (!input.items || input.items.length === 0) {
      return { success: false, error: "El pedido debe contener al menos un producto" };
    }

    const clientName = input.customerName?.trim() || input.tableNumber?.trim();
    if (!clientName) {
      return { success: false, error: "Por favor ingresa a nombre de quién es el pedido" };
    }

    // Calcular total
    const total = input.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    // Obtener siguiente número de comanda
    const lastOrder = await prisma.order.findFirst({
      orderBy: { orderNumber: "desc" },
      select: { orderNumber: true },
    });
    const nextOrderNumber = (lastOrder?.orderNumber ?? 100) + 1;

    // Crear orden con items
    const order = await prisma.order.create({
      data: {
        orderNumber: nextOrderNumber,
        tableNumber: clientName, // Usar el nombre del cliente como identificador principal
        customerName: clientName,
        waiterName: input.waiterName?.trim() || "Mesero",
        notes: input.notes?.trim() || null,
        status: "PENDIENTE_COCINA",
        total,
        items: {
          create: input.items.map((it) => ({
            productId: it.productId || null,
            productName: it.productName,
            unitPrice: it.unitPrice,
            quantity: it.quantity,
            accompaniment: it.accompaniment || null,
            notes: it.notes?.trim() || null,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    safeRevalidatePath("/cocina");
    safeRevalidatePath("/caja");
    safeRevalidatePath("/admin");

    return { success: true, order };
  } catch (error) {
    console.error("Error al crear orden:", error);
    return { success: false, error: "No se pudo registrar el pedido en el sistema" };
  }
}

export async function getKitchenOrders() {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: "PENDIENTE_COCINA",
      },
      orderBy: {
        createdAt: "asc", // FIFO: los más antiguos primero
      },
      include: {
        items: true,
      },
    });
    return orders;
  } catch (error) {
    console.error("Error al obtener órdenes de cocina:", error);
    return [];
  }
}

export async function dispatchOrder(orderId: string) {
  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "DESPACHADO",
        dispatchedAt: new Date(),
      },
    });

    safeRevalidatePath("/cocina");
    safeRevalidatePath("/caja");
    return { success: true, order };
  } catch (error) {
    console.error("Error al despachar orden:", error);
    return { success: false, error: "No se pudo despachar el pedido" };
  }
}

export async function deleteOrder(orderId: string) {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.payment.deleteMany({
        where: { orderId },
      });
      await tx.orderItem.deleteMany({
        where: { orderId },
      });
      await tx.order.delete({
        where: { id: orderId },
      });
    });

    safeRevalidatePath("/cocina");
    safeRevalidatePath("/caja");
    safeRevalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar pedido:", error);
    return { success: false, error: "No se pudo eliminar el pedido" };
  }
}

export async function getCashierOrders() {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: "DESPACHADO",
      },
      orderBy: {
        createdAt: "asc",
      },
      include: {
        items: true,
      },
    });
    return orders;
  } catch (error) {
    console.error("Error al obtener órdenes de caja:", error);
    return [];
  }
}

export async function markOrderAsPaid(
  orderId: string,
  paymentData: {
    method: "EFECTIVO" | "TRANSFERENCIA";
    amountReceived: number;
    changeGiven: number;
    proofImage?: string;
  }
) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return { success: false, error: "El pedido no fue encontrado" };
    }

    // Registrar pago y actualizar pedido en una transacción
    const updated = await prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          orderId,
          method: paymentData.method,
          amountReceived: paymentData.amountReceived,
          changeGiven: paymentData.changeGiven,
          proofImage: paymentData.proofImage || null,
        },
      });

      return tx.order.update({
        where: { id: orderId },
        data: {
          status: "PAGADO",
          paidAt: new Date(),
        },
      });
    });

    safeRevalidatePath("/caja");
    safeRevalidatePath("/admin");
    return { success: true, order: updated };
  } catch (error) {
    console.error("Error al registrar pago:", error);
    return { success: false, error: "No se pudo procesar el cobro" };
  }
}

export async function getSalesDashboard() {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Órdenes de hoy
    const todayOrders = await prisma.order.findMany({
      where: {
        status: "PAGADO",
        paidAt: {
          gte: startOfDay,
        },
      },
      include: {
        items: true,
        payment: true,
      },
      orderBy: {
        paidAt: "desc",
      },
    });

    // Órdenes del mes
    const monthOrders = await prisma.order.findMany({
      where: {
        status: "PAGADO",
        paidAt: {
          gte: startOfMonth,
        },
      },
      include: {
        items: true,
      },
    });

    const totalSalesToday = todayOrders.reduce((sum, o) => sum + o.total, 0);
    const totalSalesMonth = monthOrders.reduce((sum, o) => sum + o.total, 0);

    // Calcular platos más vendidos
    const productCounts: Record<string, { name: string; quantity: number; revenue: number }> = {};
    for (const order of monthOrders) {
      for (const item of order.items) {
        if (!productCounts[item.productName]) {
          productCounts[item.productName] = {
            name: item.productName,
            quantity: 0,
            revenue: 0,
          };
        }
        productCounts[item.productName].quantity += item.quantity;
        productCounts[item.productName].revenue += item.unitPrice * item.quantity;
      }
    }

    const topProducts = Object.values(productCounts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 6);

    // Conteo en colas activas
    const pendingKitchenCount = await prisma.order.count({
      where: { status: "PENDIENTE_COCINA" },
    });
    const pendingCashierCount = await prisma.order.count({
      where: { status: "DESPACHADO" },
    });

    return {
      totalSalesToday,
      ordersCountToday: todayOrders.length,
      averageTicketToday: todayOrders.length > 0 ? totalSalesToday / todayOrders.length : 0,
      totalSalesMonth,
      ordersCountMonth: monthOrders.length,
      topProducts,
      todayOrders,
      pendingKitchenCount,
      pendingCashierCount,
    };
  } catch (error) {
    console.error("Error al obtener dashboard:", error);
    return null;
  }
}
