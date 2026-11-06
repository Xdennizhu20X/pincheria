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

export interface UpdateOrderItemInput {
  id?: string;
  productId?: string | null;
  productName: string;
  unitPrice: number;
  quantity: number;
  accompaniment?: string | null;
  notes?: string | null;
}

export interface UpdateOrderInput {
  orderId: string;
  customerName?: string;
  tableNumber?: string;
  notes?: string | null;
  status?: string;
  items: UpdateOrderItemInput[];
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

export async function updateOrder(input: UpdateOrderInput) {
  try {
    const { orderId, customerName, tableNumber, notes, status, items } = input;

    if (!items || items.length === 0) {
      return { success: false, error: "El pedido debe contener al menos un producto" };
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!existingOrder) {
      return { success: false, error: "El pedido no fue encontrado" };
    }

    if (existingOrder.status === "PAGADO") {
      return { success: false, error: "No se puede editar un pedido que ya fue pagado" };
    }

    // Calcular nuevo total
    const total = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    const clientName = customerName?.trim() || tableNumber?.trim() || existingOrder.customerName || existingOrder.tableNumber;
    const newStatus = status || existingOrder.status;

    // Actualizar en transacción: reemplaza los items y actualiza la orden
    const updated = await prisma.$transaction(async (tx) => {
      // Eliminar items actuales de esta comanda
      await tx.orderItem.deleteMany({
        where: { orderId },
      });

      // Crear nuevos items
      await tx.orderItem.createMany({
        data: items.map((it) => ({
          orderId,
          productId: it.productId || null,
          productName: it.productName,
          unitPrice: it.unitPrice,
          quantity: it.quantity,
          accompaniment: it.accompaniment || null,
          notes: it.notes?.trim() || null,
        })),
      });

      // Actualizar cabecera de la orden
      return tx.order.update({
        where: { id: orderId },
        data: {
          customerName: clientName,
          tableNumber: clientName,
          notes: notes !== undefined ? (notes?.trim() || null) : existingOrder.notes,
          total,
          status: newStatus,
          // Si regresa a cocina, limpiar dispatchedAt
          ...(newStatus === "PENDIENTE_COCINA" ? { dispatchedAt: null } : {}),
        },
        include: {
          items: true,
        },
      });
    });

    safeRevalidatePath("/cocina");
    safeRevalidatePath("/caja");
    safeRevalidatePath("/admin");
    safeRevalidatePath("/mesero");

    return { success: true, order: updated };
  } catch (error) {
    console.error("Error al actualizar pedido:", error);
    return { success: false, error: "No se pudo actualizar el pedido" };
  }
}

export async function getActiveOrders() {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: { in: ["PENDIENTE_COCINA", "DESPACHADO"] },
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
    console.error("Error al obtener pedidos activos:", error);
    return [];
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

export async function resetSalesHistory() {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.payment.deleteMany({});
      await tx.orderItem.deleteMany({});
      await tx.order.deleteMany({});
      await tx.salesClosure.deleteMany({});
    });

    safeRevalidatePath("/cocina");
    safeRevalidatePath("/caja");
    safeRevalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error al reiniciar historial de ventas:", error);
    return { success: false, error: "No se pudo reiniciar el historial de ventas" };
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

export interface CloseSalesShiftInput {
  notes?: string;
  closedBy?: string;
}

export async function closeSalesShift(input?: CloseSalesShiftInput) {
  try {
    // 1. Obtener todos los pedidos cobrados que no han sido cerrados aún
    const openOrders = await prisma.order.findMany({
      where: {
        status: "PAGADO",
        closureId: null,
      },
      include: {
        items: true,
        payment: true,
      },
      orderBy: {
        paidAt: "asc",
      },
    });

    if (openOrders.length === 0) {
      return {
        success: false,
        error: "No hay ventas cobradas pendientes por cerrar en este turno. El contador actual está en $0.00.",
      };
    }

    // 2. Calcular acumulados del turno
    const totalSales = openOrders.reduce((sum, o) => sum + o.total, 0);
    const totalCash = openOrders.reduce((sum, o) => {
      return sum + (o.payment?.method === "EFECTIVO" ? o.total : 0);
    }, 0);
    const totalTransfer = openOrders.reduce((sum, o) => {
      return sum + (o.payment?.method === "TRANSFERENCIA" ? o.total : 0);
    }, 0);

    // 3. Resumen de platos vendidos en este turno
    const productCounts: Record<string, { name: string; quantity: number; revenue: number }> = {};
    for (const order of openOrders) {
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

    const itemsSummaryList = Object.values(productCounts).sort((a, b) => b.quantity - a.quantity);

    // 4. Fechas de inicio y cierre
    const openedAt = openOrders[0].paidAt || openOrders[0].createdAt;
    const closedAt = new Date();

    // 5. Número correlativo de cierre
    const lastClosure = await prisma.salesClosure.findFirst({
      orderBy: { closureNumber: "desc" },
      select: { closureNumber: true },
    });
    const nextClosureNumber = (lastClosure?.closureNumber ?? 0) + 1;

    // 6. Transacción para crear el Cierre y asociar los pedidos
    const closure = await prisma.$transaction(async (tx) => {
      const createdClosure = await tx.salesClosure.create({
        data: {
          closureNumber: nextClosureNumber,
          openedAt,
          closedAt,
          totalSales,
          totalCash,
          totalTransfer,
          ordersCount: openOrders.length,
          itemsSummary: JSON.stringify(itemsSummaryList),
          notes: input?.notes?.trim() || null,
          closedBy: input?.closedBy?.trim() || "Administrador",
        },
      });

      await tx.order.updateMany({
        where: {
          id: { in: openOrders.map((o) => o.id) },
        },
        data: {
          closureId: createdClosure.id,
        },
      });

      return createdClosure;
    });

    safeRevalidatePath("/admin");
    safeRevalidatePath("/caja");

    return {
      success: true,
      closure,
      itemsSummary: itemsSummaryList,
    };
  } catch (error) {
    console.error("Error al cerrar ventas:", error);
    return { success: false, error: "No se pudo completar el cierre de ventas" };
  }
}

export async function getSalesDashboard() {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Venta Actual (Turno en curso: pedidos pagados y NO cerrados todavía)
    const currentShiftOrders = await prisma.order.findMany({
      where: {
        status: "PAGADO",
        closureId: null,
      },
      include: {
        items: true,
        payment: true,
      },
      orderBy: {
        paidAt: "desc",
      },
    });

    const currentShiftTotal = currentShiftOrders.reduce((sum, o) => sum + o.total, 0);
    const currentShiftCash = currentShiftOrders.reduce((sum, o) => {
      return sum + (o.payment?.method === "EFECTIVO" ? o.total : 0);
    }, 0);
    const currentShiftTransfer = currentShiftOrders.reduce((sum, o) => {
      return sum + (o.payment?.method === "TRANSFERENCIA" ? o.total : 0);
    }, 0);
    const currentShiftOrdersCount = currentShiftOrders.length;
    const currentShiftAverageTicket =
      currentShiftOrdersCount > 0 ? currentShiftTotal / currentShiftOrdersCount : 0;

    // Platos vendidos en el turno actual
    const currentShiftProductsMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
    for (const order of currentShiftOrders) {
      for (const item of order.items) {
        if (!currentShiftProductsMap[item.productName]) {
          currentShiftProductsMap[item.productName] = {
            name: item.productName,
            quantity: 0,
            revenue: 0,
          };
        }
        currentShiftProductsMap[item.productName].quantity += item.quantity;
        currentShiftProductsMap[item.productName].revenue += item.unitPrice * item.quantity;
      }
    }
    const currentShiftTopProducts = Object.values(currentShiftProductsMap).sort(
      (a, b) => b.quantity - a.quantity
    );

    // 2. Último Cierre realizado
    const lastClosure = await prisma.salesClosure.findFirst({
      orderBy: { closureNumber: "desc" },
    });

    // 3. Lista de los últimos 25 Cierres de Ventas
    const recentClosures = await prisma.salesClosure.findMany({
      orderBy: { closureNumber: "desc" },
      take: 25,
    });

    // 4. Órdenes del día de hoy (todos los pedidos de hoy, cerrados o en curso)
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
        closure: true,
      },
      orderBy: {
        paidAt: "desc",
      },
    });

    // 5. Órdenes del mes (histórico general del mes)
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

    // Calcular platos más vendidos del mes
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
      .slice(0, 10);

    // Conteo en colas activas
    const pendingKitchenCount = await prisma.order.count({
      where: { status: "PENDIENTE_COCINA" },
    });
    const pendingCashierCount = await prisma.order.count({
      where: { status: "DESPACHADO" },
    });

    return {
      // Venta Actual / Turno en Curso
      currentShift: {
        totalSales: currentShiftTotal,
        totalCash: currentShiftCash,
        totalTransfer: currentShiftTransfer,
        ordersCount: currentShiftOrdersCount,
        averageTicket: currentShiftAverageTicket,
        topProducts: currentShiftTopProducts,
        orders: currentShiftOrders,
      },
      lastClosure,
      recentClosures,

      // Totales globales
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

export interface SalesHistoryFilter {
  rangeType: "HOY" | "AYER" | "SEMANA" | "MES" | "TODOS" | "CUSTOM";
  startDate?: string;
  endDate?: string;
  paymentMethod?: "TODOS" | "EFECTIVO" | "TRANSFERENCIA";
  searchQuery?: string;
}

export async function getFilteredSalesHistory(filter: SalesHistoryFilter) {
  try {
    const now = new Date();
    let gteDate: Date | undefined;
    let lteDate: Date | undefined;

    if (filter.rangeType === "HOY") {
      gteDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      lteDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (filter.rangeType === "AYER") {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      gteDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0);
      lteDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
    } else if (filter.rangeType === "SEMANA") {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      gteDate = new Date(sevenDaysAgo.getFullYear(), sevenDaysAgo.getMonth(), sevenDaysAgo.getDate(), 0, 0, 0);
      lteDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (filter.rangeType === "MES") {
      gteDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      lteDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (filter.rangeType === "CUSTOM" && filter.startDate) {
      const [sYear, sMonth, sDay] = filter.startDate.split("-").map(Number);
      gteDate = new Date(sYear, sMonth - 1, sDay, 0, 0, 0);
      if (filter.endDate) {
        const [eYear, eMonth, eDay] = filter.endDate.split("-").map(Number);
        lteDate = new Date(eYear, eMonth - 1, eDay, 23, 59, 59, 999);
      } else {
        lteDate = new Date(sYear, sMonth - 1, sDay, 23, 59, 59, 999);
      }
    }

    // Armar filtros de consulta
    const whereCondition: any = {
      status: "PAGADO",
    };

    if (gteDate || lteDate) {
      whereCondition.paidAt = {
        ...(gteDate ? { gte: gteDate } : {}),
        ...(lteDate ? { lte: lteDate } : {}),
      };
    }

    if (filter.paymentMethod && filter.paymentMethod !== "TODOS") {
      whereCondition.payment = {
        method: filter.paymentMethod,
      };
    }

    if (filter.searchQuery && filter.searchQuery.trim()) {
      const q = filter.searchQuery.trim();
      whereCondition.OR = [
        { customerName: { contains: q, mode: "insensitive" } },
        { tableNumber: { contains: q, mode: "insensitive" } },
        ...(isNaN(Number(q)) ? [] : [{ orderNumber: Number(q) }]),
      ];
    }

    // Consultar pedidos y cierres
    const [orders, closures] = await Promise.all([
      prisma.order.findMany({
        where: whereCondition,
        include: {
          items: true,
          payment: true,
          closure: true,
        },
        orderBy: {
          paidAt: "desc",
        },
      }),
      prisma.salesClosure.findMany({
        where:
          gteDate || lteDate
            ? {
                closedAt: {
                  ...(gteDate ? { gte: gteDate } : {}),
                  ...(lteDate ? { lte: lteDate } : {}),
                },
              }
            : undefined,
        orderBy: {
          closureNumber: "desc",
        },
      }),
    ]);

    // Resúmenes numéricos
    const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
    const totalCash = orders.reduce(
      (sum, o) => sum + (o.payment?.method === "EFECTIVO" ? o.total : 0),
      0
    );
    const totalTransfer = orders.reduce(
      (sum, o) => sum + (o.payment?.method === "TRANSFERENCIA" ? o.total : 0),
      0
    );

    // Resumen de productos más vendidos
    const productCounts: Record<string, { name: string; quantity: number; revenue: number }> = {};
    for (const order of orders) {
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
    const topProducts = Object.values(productCounts).sort((a, b) => b.quantity - a.quantity);

    return {
      orders,
      closures,
      totalSales,
      totalCash,
      totalTransfer,
      ordersCount: orders.length,
      averageTicket: orders.length > 0 ? totalSales / orders.length : 0,
      topProducts,
    };
  } catch (error) {
    console.error("Error al obtener historial filtrado:", error);
    return null;
  }
}
