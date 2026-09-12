import { prisma } from "./src/config/database.js";

const projects = await prisma.project.findMany({
  where: {
    createdById: "aaaaaaaa-2222-4222-8222-222222222222",
  },
  select: {
    id: true,
    name: true,
    createdById: true,
  },
});

console.log(JSON.stringify(projects, null, 2));

await prisma.$disconnect();
