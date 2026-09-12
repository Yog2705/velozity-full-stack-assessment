import cron from "node-cron";
import { prisma } from "../config/database.js";
import { createNotification } from "../services/notification.service.js";

export const startOverdueTaskJob = () => {
  cron.schedule("*/5 * * * *", async () => {
    try {
      console.log("Running overdue task check...");

      const now = new Date();

      const overdueTasks = await prisma.task.findMany({
        where: {
          dueDate: {
            lt: now,
          },
          status: {
            not: "DONE",
          },
          isOverdue: false,
        },
      });

      for (const task of overdueTasks) {
        await prisma.task.update({
          where: {
            id: task.id,
          },
          data: {
            isOverdue: true,
          },
        });

        if (task.assignedDeveloperId) {
          await createNotification(
            task.assignedDeveloperId,
            `Task "${task.title}" is overdue`,
            task.id
          );
        }
      }

      if (overdueTasks.length > 0) {
        console.log(
          `${overdueTasks.length} overdue task(s) processed.`
        );
      }
    } catch (error) {
      console.error(
        "OVERDUE TASK JOB ERROR:",
        error
      );
    }
  });

  console.log(
    "Overdue task background job started."
  );
};