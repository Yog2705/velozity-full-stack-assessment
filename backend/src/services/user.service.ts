import { prisma } from "../config/database.js";
import { hashPassword } from "../utils/password.js";

type UserRole =
  | "ADMIN"
  | "PROJECT_MANAGER"
  | "DEVELOPER";

export const getUsers = async () => {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          assignedTasks: true,
          createdProjects: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getUserById = async (
  userId: string
) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          assignedTasks: true,
          createdProjects: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

export const createUser = async (
  name: string,
  email: string,
  password: string,
  role: UserRole
) => {
  const existingUser =
    await prisma.user.findUnique({
      where: {
        email,
      },
    });

  if (existingUser) {
    throw new Error(
      "User with this email already exists"
    );
  }

  const passwordHash =
    await hashPassword(password);

  return prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const updateUser = async (
  userId: string,
  data: {
    name?: string;
    email?: string;
    password?: string;
    role?: UserRole;
  }
) => {
  const existingUser =
    await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

  if (!existingUser) {
    throw new Error("User not found");
  }

  if (
    data.email &&
    data.email !== existingUser.email
  ) {
    const emailUser =
      await prisma.user.findUnique({
        where: {
          email: data.email,
        },
      });

    if (emailUser) {
      throw new Error(
        "User with this email already exists"
      );
    }
  }

  const updateData: {
    name?: string;
    email?: string;
    passwordHash?: string;
    role?: UserRole;
  } = {};

  if (data.name !== undefined) {
    updateData.name = data.name;
  }

  if (data.email !== undefined) {
    updateData.email = data.email;
  }

  if (data.role !== undefined) {
    updateData.role = data.role;
  }

  if (data.password !== undefined) {
    updateData.passwordHash =
      await hashPassword(data.password);
  }

  return prisma.user.update({
    where: {
      id: userId,
    },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const deleteUser = async (
  userId: string,
  adminUserId: string
) => {
  if (userId === adminUserId) {
    throw new Error(
      "You cannot delete your own account"
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  await prisma.user.delete({
    where: {
      id: userId,
    },
  });

  return {
    success: true,
  };
};