import { prisma } from "../config/database.js";

type UserRole =
  | "ADMIN"
  | "PROJECT_MANAGER"
  | "DEVELOPER";

/**
 * Checks whether a user is allowed to access a project.
 *
 * ADMIN:
 *   Can access every project.
 *
 * PROJECT_MANAGER:
 *   Can access only projects they created.
 *
 * DEVELOPER:
 *   Cannot access project-management data directly.
 */
const canAccessProject = async (
  projectId: string,
  userId: string,
  role: UserRole
) => {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  // Admin can access any project.
  if (role === "ADMIN") {
    return project;
  }

  // Project Manager can access only their own projects.
  if (role === "PROJECT_MANAGER") {
    if (project.createdById !== userId) {
      throw new Error(
        "You are not allowed to access this project"
      );
    }

    return project;
  }

  // Developers must not access project-management data.
  throw new Error(
    "You are not allowed to access this project"
  );
};

export const createProject = async (
  name: string,
  description: string | undefined,
  clientId: string | undefined,
  createdById: string
) => {
  const project = await prisma.project.create({
    data: {
      name,

      ...(description !== undefined && {
        description,
      }),

      ...(clientId !== undefined && {
        clientId,
      }),

      createdById,
    },

    include: {
      client: true,

      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  await prisma.activityLog.create({
    data: {
      projectId: project.id,
      userId: createdById,
      type: "PROJECT_CREATED",
    },
  });

  return project;
};

export async function getProjects(
  userId: string,
  role: UserRole
) {
  // ADMIN → all projects
  if (role === "ADMIN") {
    return prisma.project.findMany({
      include: {
        client: true,

        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  }

  // PROJECT_MANAGER → only projects created by that PM
  if (role === "PROJECT_MANAGER") {
    return prisma.project.findMany({
      where: {
        createdById: userId,
      },

      include: {
        client: true,

        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  }

  // DEVELOPER → no project-management list
  return [];
}

export const getProjectById = async (
  projectId: string,
  userId: string,
  role: UserRole
) => {
  await canAccessProject(
    projectId,
    userId,
    role
  );

  return prisma.project.findUnique({
    where: {
      id: projectId,
    },

    include: {
      client: true,

      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },

      tasks: {
        include: {
          assignedDeveloper: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      },

      activities: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
};

export const updateProject = async (
  projectId: string,
  data: {
    name?: string;
    description?: string;
    clientId?: string;
  },
  userId: string,
  role: UserRole
) => {
  await canAccessProject(
    projectId,
    userId,
    role
  );

  return prisma.project.update({
    where: {
      id: projectId,
    },

    data,

    include: {
      client: true,

      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
};

export const deleteProject = async (
  projectId: string,
  userId: string,
  role: UserRole
) => {
  await canAccessProject(
    projectId,
    userId,
    role
  );

  return prisma.project.delete({
    where: {
      id: projectId,
    },
  });
};