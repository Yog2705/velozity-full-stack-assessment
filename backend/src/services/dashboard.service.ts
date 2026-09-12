import { prisma } from "../config/database.js";

export const getDashboard = async (
  userId: string,
  role: "ADMIN" | "PROJECT_MANAGER" | "DEVELOPER"
) => {
  /*
   * =========================
   * ADMIN
   * =========================
   */
  if (role === "ADMIN") {
    const [
      totalProjects,
      totalTasks,
      todoTasks,
      inProgressTasks,
      inReviewTasks,
      completedTasks,
      overdueTasks,
      developers,
    ] = await Promise.all([
      prisma.project.count(),

      prisma.task.count(),

      prisma.task.count({
        where: {
          status: "TODO",
        },
      }),

      prisma.task.count({
        where: {
          status: "IN_PROGRESS",
        },
      }),

      prisma.task.count({
        where: {
          status: "IN_REVIEW",
        },
      }),

      prisma.task.count({
        where: {
          status: "DONE",
        },
      }),

      prisma.task.count({
        where: {
          isOverdue: true,
          status: {
            not: "DONE",
          },
        },
      }),

      prisma.user.count({
        where: {
          role: "DEVELOPER",
        },
      }),
    ]);

    return {
      role,

      statistics: {
        totalProjects,
        totalTasks,
        todoTasks,
        inProgressTasks,
        inReviewTasks,
        completedTasks,
        overdueTasks,
        developers,
      },
    };
  }

  /*
   * =========================
   * PROJECT MANAGER
   * =========================
   */

  if (role === "PROJECT_MANAGER") {
    const projects = await prisma.project.findMany({
      where: {
        createdById: userId,
      },
      include: {
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
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const tasks = projects.flatMap((project) =>
      project.tasks.map((task) => ({
        ...task,
        projectName: project.name,
      }))
    );

    const totalProjects = projects.length;
    const totalTasks = tasks.length;

    const todoTasks = tasks.filter(
      (task) => task.status === "TODO"
    ).length;

    const inProgressTasks = tasks.filter(
      (task) => task.status === "IN_PROGRESS"
    ).length;

    const inReviewTasks = tasks.filter(
      (task) => task.status === "IN_REVIEW"
    ).length;

    const completedTasks = tasks.filter(
      (task) => task.status === "DONE"
    ).length;

    const overdueTasks = tasks.filter(
      (task) => task.isOverdue && task.status !== "DONE"
    ).length;

    const tasksByPriority = {
      CRITICAL: tasks.filter(
        (task) => task.priority === "CRITICAL"
      ).length,

      HIGH: tasks.filter(
        (task) => task.priority === "HIGH"
      ).length,

      MEDIUM: tasks.filter(
        (task) => task.priority === "MEDIUM"
      ).length,

      LOW: tasks.filter(
        (task) => task.priority === "LOW"
      ).length,
    };

    /*
     * Upcoming tasks due this week.
     *
     * We use the current date and calculate the end of
     * the current week (Sunday).
     */
    const now = new Date();

    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);

    const day = startOfWeek.getDay();

    startOfWeek.setDate(
      startOfWeek.getDate() - day
    );

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(
      endOfWeek.getDate() + 7
    );
    endOfWeek.setHours(23, 59, 59, 999);

    const upcomingTasks = tasks
      .filter((task) => {
        if (!task.dueDate) {
          return false;
        }

        const dueDate = new Date(task.dueDate);

        return (
          dueDate >= now &&
          dueDate <= endOfWeek &&
          task.status !== "DONE"
        );
      })
      .sort(
        (a, b) =>
          new Date(a.dueDate!).getTime() -
          new Date(b.dueDate!).getTime()
      )
      .slice(0, 10)
      .map((task) => ({
        id: task.id,
        title: task.title,
        projectName: task.projectName,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate,
        assignedDeveloper: task.assignedDeveloper,
      }));

    return {
      role,

      statistics: {
        totalProjects,
        totalTasks,
        todoTasks,
        inProgressTasks,
        inReviewTasks,
        completedTasks,
        overdueTasks,
        developers: 0,
      },

      tasksByPriority,

      upcomingTasks,
    };
  }

  /*
   * =========================
   * DEVELOPER
   * =========================
   */

  const tasks = await prisma.task.findMany({
    where: {
      assignedDeveloperId: userId,
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [
      {
        priority: "desc",
      },
      {
        dueDate: "asc",
      },
      {
        createdAt: "desc",
      },
    ],
  });

  const totalProjects = await prisma.project.count({
    where: {
      tasks: {
        some: {
          assignedDeveloperId: userId,
        },
      },
    },
  });

  const todoTasks = tasks.filter(
    (task) => task.status === "TODO"
  ).length;

  const inProgressTasks = tasks.filter(
    (task) => task.status === "IN_PROGRESS"
  ).length;

  const inReviewTasks = tasks.filter(
    (task) => task.status === "IN_REVIEW"
  ).length;

  const completedTasks = tasks.filter(
    (task) => task.status === "DONE"
  ).length;

  const overdueTasks = tasks.filter(
    (task) => task.isOverdue && task.status !== "DONE"
  ).length;

  const developerTasks = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    projectName: task.project.name,
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate,
    isOverdue: task.isOverdue,
  }));

  return {
    role,

    statistics: {
      totalProjects,
      totalTasks: tasks.length,
      todoTasks,
      inProgressTasks,
      inReviewTasks,
      completedTasks,
      overdueTasks,
      developers: 0,
    },

    tasks: developerTasks,
  };
};