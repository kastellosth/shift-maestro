import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data (optional but useful)
  await prisma.assignment.deleteMany();
  await prisma.job.deleteMany();
    await prisma.shiftGroup.deleteMany();


  // ✅ Jobs (locations)
  await prisma.job.createMany({
    data: [
      {
        key: "ROOM_GUARD", label: "Room Guard", difficulty: 3,
        requiredPeople: 1
      },
      {
        key: "ARMORY", label: "Armory", difficulty: 5,
        requiredPeople: 2
      },
      {
        key: "MOVING", label: "Moving Patrol", difficulty: 7,
        requiredPeople: 2
      }
    ]
  });

await prisma.shiftGroup.createMany({
  data: [
    {
      name: "A",
      label: "06:00–09:00, 15:00–18:00, 00:00–02:00",
      difficulty: 1
    },
    {
      name: "B",
      label: "09:00–12:00, 18:00–21:00, 02:00–04:00",
      difficulty: 2
    },
    {
      name: "C",
      label: "12:00–15:00, 21:00–24:00, 04:00–06:00",
      difficulty: 3
    }
  ]
});

  console.log("✅ Seed data inserted");
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });