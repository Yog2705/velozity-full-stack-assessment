import { prisma } from "../config/database.js";

export const createClient = async (name: string) => {
  const client = await prisma.client.create({
    data: {
      name,
    },
  });

  return client;
};

export const getClients = async () => {
  const clients = await prisma.client.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return clients;
};