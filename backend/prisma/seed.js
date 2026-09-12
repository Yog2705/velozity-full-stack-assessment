import "dotenv/config";
import { prisma } from "../src/config/database.js";
import { hashPassword } from "../src/utils/password.js";
const seed = async () => {
    console.log("🌱 Starting database seed...");
    const passwordHash = await hashPassword("password123");
    // =====================================================
    // USERS
    // =====================================================
    const admin = await prisma.user.upsert({
        where: {
            email: "seed.admin@velozity.com",
        },
        update: {
            name: "Seed Admin",
            role: "ADMIN",
            passwordHash,
        },
        create: {
            id: "11111111-1111-4111-8111-111111111111",
            name: "Seed Admin",
            email: "seed.admin@velozity.com",
            passwordHash,
            role: "ADMIN",
        },
    });
    const projectManagerOne = await prisma.user.upsert({
        where: {
            email: "seed.pm@velozity.com",
        },
        update: {
            name: "Seed Project Manager One",
            role: "PROJECT_MANAGER",
            passwordHash,
        },
        create: {
            id: "22222222-2222-4222-8222-222222222222",
            name: "Seed Project Manager One",
            email: "seed.pm@velozity.com",
            passwordHash,
            role: "PROJECT_MANAGER",
        },
    });
    const projectManagerTwo = await prisma.user.upsert({
        where: {
            email: "seed.pm2@velozity.com",
        },
        update: {
            name: "Seed Project Manager Two",
            role: "PROJECT_MANAGER",
            passwordHash,
        },
        create: {
            id: "aaaaaaaa-2222-4222-8222-222222222222",
            name: "Seed Project Manager Two",
            email: "seed.pm2@velozity.com",
            passwordHash,
            role: "PROJECT_MANAGER",
        },
    });
    const developerOne = await prisma.user.upsert({
        where: {
            email: "seed.dev1@velozity.com",
        },
        update: {
            name: "Seed Developer One",
            role: "DEVELOPER",
            passwordHash,
        },
        create: {
            id: "33333333-3333-4333-8333-333333333333",
            name: "Seed Developer One",
            email: "seed.dev1@velozity.com",
            passwordHash,
            role: "DEVELOPER",
        },
    });
    const developerTwo = await prisma.user.upsert({
        where: {
            email: "seed.dev2@velozity.com",
        },
        update: {
            name: "Seed Developer Two",
            role: "DEVELOPER",
            passwordHash,
        },
        create: {
            id: "44444444-4444-4444-8444-444444444444",
            name: "Seed Developer Two",
            email: "seed.dev2@velozity.com",
            passwordHash,
            role: "DEVELOPER",
        },
    });
    const developerThree = await prisma.user.upsert({
        where: {
            email: "seed.dev3@velozity.com",
        },
        update: {
            name: "Seed Developer Three",
            role: "DEVELOPER",
            passwordHash,
        },
        create: {
            id: "aaaaaaaa-3333-4333-8333-333333333333",
            name: "Seed Developer Three",
            email: "seed.dev3@velozity.com",
            passwordHash,
            role: "DEVELOPER",
        },
    });
    const developerFour = await prisma.user.upsert({
        where: {
            email: "seed.dev4@velozity.com",
        },
        update: {
            name: "Seed Developer Four",
            role: "DEVELOPER",
            passwordHash,
        },
        create: {
            id: "aaaaaaaa-4444-4444-8444-444444444444",
            name: "Seed Developer Four",
            email: "seed.dev4@velozity.com",
            passwordHash,
            role: "DEVELOPER",
        },
    });
    // =====================================================
    // CLIENT
    // =====================================================
    let client = await prisma.client.findFirst({
        where: {
            name: "Seed Client",
        },
    });
    if (!client) {
        client = await prisma.client.create({
            data: {
                name: "Seed Client",
                email: "client@velozity.com",
                phone: "+91 9000000000",
            },
        });
    }
    // =====================================================
    // PROJECTS
    // =====================================================
    const projectOne = await prisma.project.upsert({
        where: {
            id: "55555555-5555-4555-8555-555555555555",
        },
        update: {
            name: "Seed Project Management System",
            description: "Sample project management platform for assessment testing.",
            clientId: client.id,
            createdById: projectManagerOne.id,
        },
        create: {
            id: "55555555-5555-4555-8555-555555555555",
            name: "Seed Project Management System",
            description: "Sample project management platform for assessment testing.",
            clientId: client.id,
            createdById: projectManagerOne.id,
        },
    });
    const projectTwo = await prisma.project.upsert({
        where: {
            id: "55555555-6666-4666-8666-666666666666",
        },
        update: {
            name: "Seed E-Commerce Platform",
            description: "E-commerce project containing tasks across different priorities and statuses.",
            clientId: client.id,
            createdById: projectManagerOne.id,
        },
        create: {
            id: "55555555-6666-4666-8666-666666666666",
            name: "Seed E-Commerce Platform",
            description: "E-commerce project containing tasks across different priorities and statuses.",
            clientId: client.id,
            createdById: projectManagerOne.id,
        },
    });
    const projectThree = await prisma.project.upsert({
        where: {
            id: "55555555-7777-4777-8777-777777777777",
        },
        update: {
            name: "Seed Mobile Application",
            description: "Mobile application project owned by the second project manager.",
            clientId: client.id,
            createdById: projectManagerTwo.id,
        },
        create: {
            id: "55555555-7777-4777-8777-777777777777",
            name: "Seed Mobile Application",
            description: "Mobile application project owned by the second project manager.",
            clientId: client.id,
            createdById: projectManagerTwo.id,
        },
    });
    // =====================================================
    // DATE HELPERS
    // =====================================================
    const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    // =====================================================
    // PROJECT 1 TASKS
    // =====================================================
    await prisma.task.upsert({
        where: {
            id: "66666666-6666-4666-8666-666666666661",
        },
        update: {
            title: "Design project dashboard",
            description: "Create the initial dashboard design.",
            projectId: projectOne.id,
            assignedDeveloperId: developerOne.id,
            status: "IN_PROGRESS",
            priority: "HIGH",
            dueDate: daysFromNow(5),
            isOverdue: false,
        },
        create: {
            id: "66666666-6666-4666-8666-666666666661",
            title: "Design project dashboard",
            description: "Create the initial dashboard design.",
            projectId: projectOne.id,
            assignedDeveloperId: developerOne.id,
            status: "IN_PROGRESS",
            priority: "HIGH",
            dueDate: daysFromNow(5),
            isOverdue: false,
        },
    });
    await prisma.task.upsert({
        where: {
            id: "66666666-6666-4666-8666-666666666662",
        },
        update: {
            title: "Implement authentication",
            description: "Implement JWT authentication and refresh tokens.",
            projectId: projectOne.id,
            assignedDeveloperId: developerTwo.id,
            status: "DONE",
            priority: "CRITICAL",
            dueDate: daysFromNow(-2),
            isOverdue: false,
        },
        create: {
            id: "66666666-6666-4666-8666-666666666662",
            title: "Implement authentication",
            description: "Implement JWT authentication and refresh tokens.",
            projectId: projectOne.id,
            assignedDeveloperId: developerTwo.id,
            status: "DONE",
            priority: "CRITICAL",
            dueDate: daysFromNow(-2),
            isOverdue: false,
        },
    });
    await prisma.task.upsert({
        where: {
            id: "66666666-6666-4666-8666-666666666663",
        },
        update: {
            title: "Create API documentation",
            description: "Document the project management API.",
            projectId: projectOne.id,
            assignedDeveloperId: developerThree.id,
            status: "TODO",
            priority: "MEDIUM",
            dueDate: daysFromNow(7),
            isOverdue: false,
        },
        create: {
            id: "66666666-6666-4666-8666-666666666663",
            title: "Create API documentation",
            description: "Document the project management API.",
            projectId: projectOne.id,
            assignedDeveloperId: developerThree.id,
            status: "TODO",
            priority: "MEDIUM",
            dueDate: daysFromNow(7),
            isOverdue: false,
        },
    });
    await prisma.task.upsert({
        where: {
            id: "66666666-6666-4666-8666-666666666664",
        },
        update: {
            title: "Build task management API",
            description: "Implement task creation, update and filtering endpoints.",
            projectId: projectOne.id,
            assignedDeveloperId: developerFour.id,
            status: "IN_REVIEW",
            priority: "HIGH",
            dueDate: daysFromNow(3),
            isOverdue: false,
        },
        create: {
            id: "66666666-6666-4666-8666-666666666664",
            title: "Build task management API",
            description: "Implement task creation, update and filtering endpoints.",
            projectId: projectOne.id,
            assignedDeveloperId: developerFour.id,
            status: "IN_REVIEW",
            priority: "HIGH",
            dueDate: daysFromNow(3),
            isOverdue: false,
        },
    });
    await prisma.task.upsert({
        where: {
            id: "66666666-6666-4666-8666-666666666665",
        },
        update: {
            title: "Fix overdue authentication bug",
            description: "Resolve an authentication issue discovered during testing.",
            projectId: projectOne.id,
            assignedDeveloperId: developerOne.id,
            status: "IN_PROGRESS",
            priority: "CRITICAL",
            dueDate: daysFromNow(-3),
            isOverdue: true,
        },
        create: {
            id: "66666666-6666-4666-8666-666666666665",
            title: "Fix overdue authentication bug",
            description: "Resolve an authentication issue discovered during testing.",
            projectId: projectOne.id,
            assignedDeveloperId: developerOne.id,
            status: "IN_PROGRESS",
            priority: "CRITICAL",
            dueDate: daysFromNow(-3),
            isOverdue: true,
        },
    });
    // =====================================================
    // PROJECT 2 TASKS
    // =====================================================
    await prisma.task.upsert({
        where: {
            id: "66666666-6666-4666-8666-666666666671",
        },
        update: {
            title: "Create product catalogue",
            description: "Build the product catalogue interface.",
            projectId: projectTwo.id,
            assignedDeveloperId: developerTwo.id,
            status: "TODO",
            priority: "MEDIUM",
            dueDate: daysFromNow(6),
            isOverdue: false,
        },
        create: {
            id: "66666666-6666-4666-8666-666666666671",
            title: "Create product catalogue",
            description: "Build the product catalogue interface.",
            projectId: projectTwo.id,
            assignedDeveloperId: developerTwo.id,
            status: "TODO",
            priority: "MEDIUM",
            dueDate: daysFromNow(6),
            isOverdue: false,
        },
    });
    await prisma.task.upsert({
        where: {
            id: "66666666-6666-4666-8666-666666666672",
        },
        update: {
            title: "Implement shopping cart",
            description: "Implement shopping cart functionality.",
            projectId: projectTwo.id,
            assignedDeveloperId: developerThree.id,
            status: "IN_PROGRESS",
            priority: "HIGH",
            dueDate: daysFromNow(4),
            isOverdue: false,
        },
        create: {
            id: "66666666-6666-4666-8666-666666666672",
            title: "Implement shopping cart",
            description: "Implement shopping cart functionality.",
            projectId: projectTwo.id,
            assignedDeveloperId: developerThree.id,
            status: "IN_PROGRESS",
            priority: "HIGH",
            dueDate: daysFromNow(4),
            isOverdue: false,
        },
    });
    await prisma.task.upsert({
        where: {
            id: "66666666-6666-4666-8666-666666666673",
        },
        update: {
            title: "Payment gateway integration",
            description: "Integrate secure payment processing.",
            projectId: projectTwo.id,
            assignedDeveloperId: developerFour.id,
            status: "IN_REVIEW",
            priority: "CRITICAL",
            dueDate: daysFromNow(2),
            isOverdue: false,
        },
        create: {
            id: "66666666-6666-4666-8666-666666666673",
            title: "Payment gateway integration",
            description: "Integrate secure payment processing.",
            projectId: projectTwo.id,
            assignedDeveloperId: developerFour.id,
            status: "IN_REVIEW",
            priority: "CRITICAL",
            dueDate: daysFromNow(2),
            isOverdue: false,
        },
    });
    await prisma.task.upsert({
        where: {
            id: "66666666-6666-4666-8666-666666666674",
        },
        update: {
            title: "Order history module",
            description: "Create customer order history functionality.",
            projectId: projectTwo.id,
            assignedDeveloperId: developerOne.id,
            status: "DONE",
            priority: "LOW",
            dueDate: daysFromNow(-1),
            isOverdue: false,
        },
        create: {
            id: "66666666-6666-4666-8666-666666666674",
            title: "Order history module",
            description: "Create customer order history functionality.",
            projectId: projectTwo.id,
            assignedDeveloperId: developerOne.id,
            status: "DONE",
            priority: "LOW",
            dueDate: daysFromNow(-1),
            isOverdue: false,
        },
    });
    await prisma.task.upsert({
        where: {
            id: "66666666-6666-4666-8666-666666666675",
        },
        update: {
            title: "Fix checkout validation",
            description: "Fix validation issues in the checkout process.",
            projectId: projectTwo.id,
            assignedDeveloperId: developerTwo.id,
            status: "TODO",
            priority: "HIGH",
            dueDate: daysFromNow(-4),
            isOverdue: true,
        },
        create: {
            id: "66666666-6666-4666-8666-666666666675",
            title: "Fix checkout validation",
            description: "Fix validation issues in the checkout process.",
            projectId: projectTwo.id,
            assignedDeveloperId: developerTwo.id,
            status: "TODO",
            priority: "HIGH",
            dueDate: daysFromNow(-4),
            isOverdue: true,
        },
    });
    // =====================================================
    // PROJECT 3 TASKS
    // =====================================================
    await prisma.task.upsert({
        where: {
            id: "66666666-6666-4666-8666-666666666681",
        },
        update: {
            title: "Mobile login screen",
            description: "Build the mobile login interface.",
            projectId: projectThree.id,
            assignedDeveloperId: developerThree.id,
            status: "IN_PROGRESS",
            priority: "HIGH",
            dueDate: daysFromNow(5),
            isOverdue: false,
        },
        create: {
            id: "66666666-6666-4666-8666-666666666681",
            title: "Mobile login screen",
            description: "Build the mobile login interface.",
            projectId: projectThree.id,
            assignedDeveloperId: developerThree.id,
            status: "IN_PROGRESS",
            priority: "HIGH",
            dueDate: daysFromNow(5),
            isOverdue: false,
        },
    });
    await prisma.task.upsert({
        where: {
            id: "66666666-6666-4666-8666-666666666682",
        },
        update: {
            title: "Push notification service",
            description: "Implement mobile push notifications.",
            projectId: projectThree.id,
            assignedDeveloperId: developerFour.id,
            status: "TODO",
            priority: "MEDIUM",
            dueDate: daysFromNow(8),
            isOverdue: false,
        },
        create: {
            id: "66666666-6666-4666-8666-666666666682",
            title: "Push notification service",
            description: "Implement mobile push notifications.",
            projectId: projectThree.id,
            assignedDeveloperId: developerFour.id,
            status: "TODO",
            priority: "MEDIUM",
            dueDate: daysFromNow(8),
            isOverdue: false,
        },
    });
    await prisma.task.upsert({
        where: {
            id: "66666666-6666-4666-8666-666666666683",
        },
        update: {
            title: "Mobile dashboard",
            description: "Create the mobile dashboard screen.",
            projectId: projectThree.id,
            assignedDeveloperId: developerOne.id,
            status: "IN_REVIEW",
            priority: "HIGH",
            dueDate: daysFromNow(3),
            isOverdue: false,
        },
        create: {
            id: "66666666-6666-4666-8666-666666666683",
            title: "Mobile dashboard",
            description: "Create the mobile dashboard screen.",
            projectId: projectThree.id,
            assignedDeveloperId: developerOne.id,
            status: "IN_REVIEW",
            priority: "HIGH",
            dueDate: daysFromNow(3),
            isOverdue: false,
        },
    });
    await prisma.task.upsert({
        where: {
            id: "66666666-6666-4666-8666-666666666684",
        },
        update: {
            title: "Offline data synchronization",
            description: "Implement offline synchronization for mobile users.",
            projectId: projectThree.id,
            assignedDeveloperId: developerTwo.id,
            status: "DONE",
            priority: "CRITICAL",
            dueDate: daysFromNow(-1),
            isOverdue: false,
        },
        create: {
            id: "66666666-6666-4666-8666-666666666684",
            title: "Offline data synchronization",
            description: "Implement offline synchronization for mobile users.",
            projectId: projectThree.id,
            assignedDeveloperId: developerTwo.id,
            status: "DONE",
            priority: "CRITICAL",
            dueDate: daysFromNow(-1),
            isOverdue: false,
        },
    });
    await prisma.task.upsert({
        where: {
            id: "66666666-6666-4666-8666-666666666685",
        },
        update: {
            title: "Mobile API optimisation",
            description: "Optimise API calls for mobile performance.",
            projectId: projectThree.id,
            assignedDeveloperId: developerFour.id,
            status: "IN_PROGRESS",
            priority: "MEDIUM",
            dueDate: daysFromNow(10),
            isOverdue: false,
        },
        create: {
            id: "66666666-6666-4666-8666-666666666685",
            title: "Mobile API optimisation",
            description: "Optimise API calls for mobile performance.",
            projectId: projectThree.id,
            assignedDeveloperId: developerFour.id,
            status: "IN_PROGRESS",
            priority: "MEDIUM",
            dueDate: daysFromNow(10),
            isOverdue: false,
        },
    });
    // =====================================================
    // ACTIVITY LOGS
    // =====================================================
    const activityLogs = [
        {
            id: "77777777-7777-4777-8777-777777777771",
            type: "TASK_CREATED",
            projectId: projectOne.id,
            taskId: "66666666-6666-4666-8666-666666666661",
            userId: projectManagerOne.id,
        },
        {
            id: "77777777-7777-4777-8777-777777777772",
            type: "TASK_STATUS_CHANGED",
            projectId: projectOne.id,
            taskId: "66666666-6666-4666-8666-666666666662",
            userId: developerTwo.id,
            oldStatus: "IN_PROGRESS",
            newStatus: "DONE",
        },
        {
            id: "77777777-7777-4777-8777-777777777773",
            type: "TASK_ASSIGNED",
            projectId: projectOne.id,
            taskId: "66666666-6666-4666-8666-666666666661",
            userId: projectManagerOne.id,
        },
        {
            id: "77777777-7777-4777-8777-777777777774",
            type: "TASK_CREATED",
            projectId: projectTwo.id,
            taskId: "66666666-6666-4666-8666-666666666671",
            userId: projectManagerOne.id,
        },
        {
            id: "77777777-7777-4777-8777-777777777775",
            type: "TASK_ASSIGNED",
            projectId: projectTwo.id,
            taskId: "66666666-6666-4666-8666-666666666672",
            userId: projectManagerOne.id,
        },
        {
            id: "77777777-7777-4777-8777-777777777776",
            type: "TASK_STATUS_CHANGED",
            projectId: projectTwo.id,
            taskId: "66666666-6666-4666-8666-666666666673",
            userId: developerFour.id,
            oldStatus: "IN_PROGRESS",
            newStatus: "IN_REVIEW",
        },
        {
            id: "77777777-7777-4777-8777-777777777777",
            type: "TASK_CREATED",
            projectId: projectThree.id,
            taskId: "66666666-6666-4666-8666-666666666681",
            userId: projectManagerTwo.id,
        },
        {
            id: "77777777-7777-4777-8777-777777777778",
            type: "TASK_ASSIGNED",
            projectId: projectThree.id,
            taskId: "66666666-6666-4666-8666-666666666682",
            userId: projectManagerTwo.id,
        },
    ];
    for (const activity of activityLogs) {
        await prisma.activityLog.upsert({
            where: {
                id: activity.id,
            },
            update: {},
            create: activity,
        });
    }
    // =====================================================
    // NOTIFICATIONS
    // =====================================================
    await prisma.notification.upsert({
        where: {
            id: "88888888-8888-4888-8888-888888888881",
        },
        update: {
            userId: developerOne.id,
            taskId: "66666666-6666-4666-8666-666666666661",
            message: "You have been assigned a new task: Design project dashboard",
            isRead: false,
            readAt: null,
        },
        create: {
            id: "88888888-8888-4888-8888-888888888881",
            userId: developerOne.id,
            taskId: "66666666-6666-4666-8666-666666666661",
            message: "You have been assigned a new task: Design project dashboard",
            isRead: false,
        },
    });
    await prisma.notification.upsert({
        where: {
            id: "88888888-8888-4888-8888-888888888882",
        },
        update: {
            userId: projectManagerOne.id,
            taskId: "66666666-6666-4666-8666-666666666662",
            message: "Task 'Implement authentication' has been completed.",
            isRead: false,
            readAt: null,
        },
        create: {
            id: "88888888-8888-4888-8888-888888888882",
            userId: projectManagerOne.id,
            taskId: "66666666-6666-4666-8666-666666666662",
            message: "Task 'Implement authentication' has been completed.",
            isRead: false,
        },
    });
    await prisma.notification.upsert({
        where: {
            id: "88888888-8888-4888-8888-888888888883",
        },
        update: {
            userId: developerTwo.id,
            taskId: "66666666-6666-4666-8666-666666666675",
            message: "You have an overdue task: Fix checkout validation",
            isRead: false,
            readAt: null,
        },
        create: {
            id: "88888888-8888-4888-8888-888888888883",
            userId: developerTwo.id,
            taskId: "66666666-6666-4666-8666-666666666675",
            message: "You have an overdue task: Fix checkout validation",
            isRead: false,
        },
    });
    // =====================================================
    // SUMMARY
    // =====================================================
    console.log("");
    console.log("✅ Database seed completed successfully!");
    console.log("");
    console.log("Seed accounts:");
    console.log("Admin:       seed.admin@velozity.com");
    console.log("PM 1:        seed.pm@velozity.com");
    console.log("PM 2:        seed.pm2@velozity.com");
    console.log("Developer 1: seed.dev1@velozity.com");
    console.log("Developer 2: seed.dev2@velozity.com");
    console.log("Developer 3: seed.dev3@velozity.com");
    console.log("Developer 4: seed.dev4@velozity.com");
    console.log("Password:    password123");
    console.log("");
    console.log("Projects:    3");
    console.log("Tasks:       15");
    console.log("Overdue:     2");
    console.log("Activities:  8");
    console.log("");
};
seed()
    .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map