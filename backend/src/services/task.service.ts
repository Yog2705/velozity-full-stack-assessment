import { prisma } from "../config/database.js";
import { emitProjectActivity } from "../sockets/socket.js";
import { createNotification } from "./notification.service.js";

type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "DONE";

type TaskPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

type UserRole =
  | "ADMIN"
  | "PROJECT_MANAGER"
  | "DEVELOPER";

interface CreateTaskData {
  title: string;
  description?: string | null;
  projectId: string;
  assignedDeveloperId?: string | null;
  priority?: TaskPriority;
  dueDate?: string | null;
}

interface UpdateTaskData {
  title?: string;
  description?: string | null;
  assignedDeveloperId?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
}

interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  overdue?: boolean;
  dueDateFrom?: string;
  dueDateTo?: string;
}

const calculateOverdue = (
  dueDate: Date | null,
  status: TaskStatus
) => {
  if (!dueDate || status === "DONE") {
    return false;
  }

  return dueDate < new Date();
};

const verifyProjectAccess = async (
  projectId: string,
  userId: string,
  role: UserRole
) => {
  const project =
    await prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

  if (!project) {
    throw new Error("Project not found");
  }

  if (
    role === "PROJECT_MANAGER" &&
    project.createdById !== userId
  ) {
    throw new Error(
      "You are not allowed to access this project"
    );
  }

  if (role === "DEVELOPER") {
    throw new Error(
      "Developers cannot create tasks"
    );
  }

  return project;
};

export const createTask = async (
  data: CreateTaskData,
  createdById: string,
  role: UserRole = "ADMIN"
) => {
  await verifyProjectAccess(
    data.projectId,
    createdById,
    role
  );

  if (data.assignedDeveloperId) {
    const developer =
      await prisma.user.findUnique({
        where: {
          id: data.assignedDeveloperId,
        },
      });

    if (
      !developer ||
      developer.role !== "DEVELOPER"
    ) {
      throw new Error(
        "Assigned user must be a developer"
      );
    }
  }

  const dueDate = data.dueDate
    ? new Date(data.dueDate)
    : null;

  if (
    dueDate &&
    Number.isNaN(dueDate.getTime())
  ) {
    throw new Error("Invalid due date");
  }

  const status: TaskStatus = "TODO";

  const task =
    await prisma.task.create({
      data: {
        title: data.title,
        description:
          data.description ?? null,
        projectId: data.projectId,
        assignedDeveloperId:
          data.assignedDeveloperId ?? null,
        priority:
          data.priority ?? "MEDIUM",
        dueDate,
        status,
        isOverdue: calculateOverdue(
          dueDate,
          status
        ),
      },

      include: {
        project: true,

        assignedDeveloper: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

  const activity =
    await prisma.activityLog.create({
      data: {
        type: "TASK_CREATED",
        projectId: task.projectId,
        taskId: task.id,
        userId: createdById,
      },

      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

  emitProjectActivity(
    task.projectId,
    activity
  );

  if (data.assignedDeveloperId) {
    await createNotification(
      data.assignedDeveloperId,
      `You have been assigned a new task: ${task.title}`,
      task.id
    );
  }

  return task;
};

export const getTasks = async (
  userId: string,
  role: UserRole,
  filters: TaskFilters = {}
) => {
  const where: Record<
    string,
    unknown
  > = {};

  /*
   * Developers can ONLY see tasks assigned
   * to themselves.
   */
  if (role === "DEVELOPER") {
    where.assignedDeveloperId = userId;
  }

  /*
   * PMs can ONLY see tasks belonging to
   * projects created by themselves.
   */
  if (role === "PROJECT_MANAGER") {
    where.project = {
      createdById: userId,
    };
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.priority) {
    where.priority = filters.priority;
  }

  if (filters.overdue !== undefined) {
    where.isOverdue = filters.overdue;
  }

  /*
   * Due-date range filter.
   */
  if (
    filters.dueDateFrom ||
    filters.dueDateTo
  ) {
    const dueDateFilter: {
      gte?: Date;
      lte?: Date;
    } = {};

    if (filters.dueDateFrom) {
      const fromDate =
        new Date(
          filters.dueDateFrom
        );

      if (
        Number.isNaN(
          fromDate.getTime()
        )
      ) {
        throw new Error(
          "Invalid dueDateFrom"
        );
      }

      dueDateFilter.gte = fromDate;
    }

    if (filters.dueDateTo) {
      const toDate =
        new Date(
          filters.dueDateTo
        );

      if (
        Number.isNaN(
          toDate.getTime()
        )
      ) {
        throw new Error(
          "Invalid dueDateTo"
        );
      }

      /*
       * Include the complete
       * "to" date.
       */
      toDate.setHours(
        23,
        59,
        59,
        999
      );

      dueDateFilter.lte = toDate;
    }

    where.dueDate =
      dueDateFilter;
  }

  return prisma.task.findMany({
    where,

    include: {
      project: true,

      assignedDeveloper: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
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
};

export const getTaskById = async (
  taskId: string,
  userId: string,
  role: UserRole
) => {
  const task =
    await prisma.task.findUnique({
      where: {
        id: taskId,
      },

      include: {
        project: true,

        assignedDeveloper: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },

        activities: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
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

  if (!task) {
    throw new Error("Task not found");
  }

  /*
   * Developer can only access
   * their assigned tasks.
   */
  if (
    role === "DEVELOPER" &&
    task.assignedDeveloperId !== userId
  ) {
    throw new Error(
      "You are not allowed to access this task"
    );
  }

  /*
   * PM can only access tasks
   * in their own projects.
   */
  if (
    role === "PROJECT_MANAGER" &&
    task.project.createdById !== userId
  ) {
    throw new Error(
      "You are not allowed to access this task"
    );
  }

  return task;
};

export const updateTask = async (
  taskId: string,
  data: UpdateTaskData,
  userId: string,
  role: UserRole
) => {
  const existingTask =
    await prisma.task.findUnique({
      where: {
        id: taskId,
      },

      include: {
        project: true,
      },
    });

  if (!existingTask) {
    throw new Error("Task not found");
  }

  /*
   * =========================
   * DEVELOPER SECURITY
   * =========================
   *
   * Developers may update ONLY
   * the status of their own tasks.
   */
  if (role === "DEVELOPER") {
    if (
      existingTask.assignedDeveloperId !==
      userId
    ) {
      throw new Error(
        "Developers can only update tasks assigned to them"
      );
    }

    const developerUpdateKeys =
      Object.keys(data);

    const invalidKeys =
      developerUpdateKeys.filter(
        (key) => key !== "status"
      );

    if (invalidKeys.length > 0) {
      throw new Error(
        "Developers can only update task status"
      );
    }

    if (!data.status) {
      throw new Error(
        "Task status is required"
      );
    }
  }

  /*
   * PM can only update tasks belonging
   * to their own projects.
   */
  if (
    role === "PROJECT_MANAGER" &&
    existingTask.project.createdById !==
      userId
  ) {
    throw new Error(
      "You are not allowed to update this task"
    );
  }

  /*
   * Validate assigned developer for
   * Admin/PM updates.
   *
   * Check !== undefined so null is also
   * handled intentionally.
   */
  if (
    role !== "DEVELOPER" &&
    data.assignedDeveloperId !==
      undefined
  ) {
    if (data.assignedDeveloperId === null) {
      // Explicitly unassigning is allowed
      // for Admin/PM.
    } else {
      const developer =
        await prisma.user.findUnique({
          where: {
            id: data.assignedDeveloperId,
          },
        });

      if (
        !developer ||
        developer.role !== "DEVELOPER"
      ) {
        throw new Error(
          "Assigned user must be a developer"
        );
      }
    }
  }

  const newStatus =
    data.status ??
    existingTask.status;

  const newDueDate =
    data.dueDate !== undefined
      ? data.dueDate
        ? new Date(data.dueDate)
        : null
      : existingTask.dueDate;

  if (
    newDueDate &&
    Number.isNaN(
      newDueDate.getTime()
    )
  ) {
    throw new Error(
      "Invalid due date"
    );
  }

  /*
   * Only allow Admin/PM to update
   * management fields.
   *
   * Developers have already been
   * restricted to status above.
   */
  const updateData =
    role === "DEVELOPER"
      ? {
          status: data.status!,
          isOverdue:
            calculateOverdue(
              newDueDate,
              newStatus
            ),
        }
      : {
          ...data,
          dueDate: newDueDate,
          isOverdue:
            calculateOverdue(
              newDueDate,
              newStatus
            ),
        };

  const task =
    await prisma.task.update({
      where: {
        id: taskId,
      },

      data: updateData,

      include: {
        project: true,

        assignedDeveloper: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

  /*
   * =========================
   * STATUS ACTIVITY
   * =========================
   */

  if (
    data.status &&
    data.status !==
      existingTask.status
  ) {
    const activity =
      await prisma.activityLog.create({
        data: {
          type:
            "TASK_STATUS_CHANGED",
          projectId:
            task.projectId,
          taskId: task.id,
          userId,
          oldStatus:
            existingTask.status,
          newStatus:
            data.status,
        },

        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

    emitProjectActivity(
      task.projectId,
      activity
    );

    /*
     * Notify assigned developer
     * about status changes.
     */
    if (
      task.assignedDeveloperId
    ) {
      await createNotification(
        task.assignedDeveloperId,
        `Task "${task.title}" status changed to ${data.status}`,
        task.id
      );
    }

    /*
     * PM notification when task
     * moves to In Review.
     */
    if (
      data.status === "IN_REVIEW"
    ) {
      const projectOwner =
        await prisma.project.findUnique({
          where: {
            id: task.projectId,
          },

          select: {
            createdById: true,
          },
        });

      if (
        projectOwner &&
        projectOwner.createdById !==
          userId
      ) {
        await createNotification(
          projectOwner.createdById,
          `Task "${task.title}" has moved to In Review`,
          task.id
        );
      }
    }
  }

  /*
   * =========================
   * ASSIGNMENT ACTIVITY
   * =========================
   */

  if (
    role !== "DEVELOPER" &&
    data.assignedDeveloperId !==
      undefined &&
    data.assignedDeveloperId !==
      existingTask.assignedDeveloperId
  ) {
    const activity =
      await prisma.activityLog.create({
        data: {
          type:
            "TASK_ASSIGNED",
          projectId:
            task.projectId,
          taskId: task.id,
          userId,
        },

        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

    emitProjectActivity(
      task.projectId,
      activity
    );

    if (
      data.assignedDeveloperId
    ) {
      await createNotification(
        data.assignedDeveloperId,
        `You have been assigned task: ${task.title}`,
        task.id
      );
    }
  }

  return task;
};

export const deleteTask = async (
  taskId: string,
  userId: string,
  role: UserRole
) => {
  const task =
    await prisma.task.findUnique({
      where: {
        id: taskId,
      },

      include: {
        project: true,
      },
    });

  if (!task) {
    throw new Error("Task not found");
  }

  /*
   * PM can delete only tasks in
   * their own projects.
   */
  if (
    role === "PROJECT_MANAGER" &&
    task.project.createdById !==
      userId
  ) {
    throw new Error(
      "You are not allowed to delete this task"
    );
  }

  /*
   * Developers cannot delete tasks.
   */
  if (role === "DEVELOPER") {
    throw new Error(
      "Developers cannot delete tasks"
    );
  }

  return prisma.task.delete({
    where: {
      id: taskId,
    },
  });
};