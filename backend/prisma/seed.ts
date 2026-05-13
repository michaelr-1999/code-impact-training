import prisma from "../src/lib/prisma";

async function main() {
  const systemCategories = ["Work", "Personal", "Health", "Finance"];

  for (const name of systemCategories) {
    await prisma.reminderCategory.upsert({
      where: { id: name.toLowerCase() },
      update: {},
      create: { id: name.toLowerCase(), userId: null, name },
    });
  }

  // eslint-disable-next-line no-console
  console.log("Seeded system reminder categories:", systemCategories.join(", "));
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
