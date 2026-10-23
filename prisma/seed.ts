import { PrismaClient } from "@prisma/client";
import { INITIAL_PRODUCTS } from "../src/lib/constants";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando sembrado de productos del menú...");

  for (const prod of INITIAL_PRODUCTS) {
    const existing = await prisma.product.findFirst({
      where: { name: prod.name },
    });

    if (!existing) {
      await prisma.product.create({
        data: {
          name: prod.name,
          category: prod.category,
          subCategory: prod.subCategory,
          price: prod.price,
          hasAccompaniments: prod.hasAccompaniments,
          description: prod.description,
          imageUrl: prod.imageUrl,
          sortOrder: prod.sortOrder,
          isActive: true,
        },
      });
      console.log(`+ Creado: ${prod.name} ($${prod.price.toFixed(2)})`);
    } else {
      console.log(`= Ya existe: ${prod.name}`);
    }
  }

  console.log("¡Sembrado completado con éxito!");
}

main()
  .catch((e) => {
    console.error("Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
