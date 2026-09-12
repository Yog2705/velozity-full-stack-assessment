import { useEffect, useState } from "react";
import { getDashboard } from "../services/api";
import {
  connectSocket,
  disconnectSocket,
} from "../services/socket";

interface DashboardTask {
  id: string;
  title: string;
  projectName: string;
  priority: string;
  status: string;
  dueDate: string | null;
  isOverdue?: boolean;
  assignedDeveloper?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface DashboardData {
  role: string;

  statistics: {
    totalProjects: number;
    totalTasks: number;
    todoTasks: number;
    inProgressTasks: number;
    inReviewTasks: number;
    completedTasks: number;
    overdueTasks: number;
    developers: number;
  };

  tasksByPriority?: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };

  upcomingTasks?: DashboardTask[];

  tasks?: DashboardTask[];
}

interface Props {
  userName: string;
}

function Dashboard({ userName }: Props) {
  const [data, setData] =
    useState<DashboardData | null>(null);

  const [error, setError] = useState("");

  const [onlineCount, setOnlineCount] =
    useState(0);

  /*
   * =========================
   * LOAD DASHBOARD
   * =========================
   */

  useEffect(() => {
    const token = window.token;

    if (!token) {
      setError(
        "Authentication token not found"
      );

      return;
    }

    getDashboard(token)
      .then((response) => {
        setData(response.data);
      })
      .catch((err) => {
        setError(
          err.message ||
            "Failed to load dashboard"
        );
      });
  }, []);

  /*
   * =========================
   * SOCKET / PRESENCE
   * =========================
   *
   * Every logged-in user connects
   * so the backend can accurately
   * count online users.
   *
   * Only Admin displays the count.
   */

  useEffect(() => {
    if (!data) {
      return;
    }

    const token = window.token;

    if (!token) {
      return;
    }

    const socket = connectSocket(token);

    const handlePresenceUpdate = (
      payload: {
        onlineCount: number;
      }
    ) => {
      setOnlineCount(
        payload.onlineCount
      );
    };

    socket.on(
      "presence:update",
      handlePresenceUpdate
    );

    return () => {
      socket.off(
        "presence:update",
        handlePresenceUpdate
      );

      disconnectSocket();
    };
  }, [data]);

  /*
   * =========================
   * ERROR
   * =========================
   */

  if (error) {
    return (
      <div className="error-box">
        {error}
      </div>
    );
  }

  /*
   * =========================
   * LOADING
   * =========================
   */

  if (!data) {
    return (
      <div className="loading">
        Loading dashboard...
      </div>
    );
  }

  const stats = data.statistics;

  return (
    <section>
      {/* =========================
          PAGE HEADING
      ========================= */}

      <div className="page-heading">
        <div>
          <p className="eyebrow">
            OVERVIEW
          </p>

          <h1>
            Welcome back, {userName}
          </h1>

          <p className="muted">
            Here's what's happening across
            your workspace.
          </p>
        </div>

        <span className="role-badge">
          {data.role.replace(
            "_",
            " "
          )}
        </span>
      </div>

      {/* =========================
          STATISTICS
      ========================= */}

      <div className="stats-grid">
        <div className="stat-card">
          <span>Projects</span>

          <strong>
            {stats.totalProjects}
          </strong>
        </div>

        <div className="stat-card">
          <span>Total Tasks</span>

          <strong>
            {stats.totalTasks}
          </strong>
        </div>

        <div className="stat-card">
          <span>To Do</span>

          <strong>
            {stats.todoTasks}
          </strong>
        </div>

        <div className="stat-card">
          <span>In Progress</span>

          <strong>
            {stats.inProgressTasks}
          </strong>
        </div>

        <div className="stat-card">
          <span>In Review</span>

          <strong>
            {stats.inReviewTasks}
          </strong>
        </div>

        <div className="stat-card">
          <span>Completed</span>

          <strong>
            {stats.completedTasks}
          </strong>
        </div>

        <div className="stat-card">
          <span>Overdue</span>

          <strong>
            {stats.overdueTasks}
          </strong>
        </div>

        {data.role !== "DEVELOPER" && (
          <div className="stat-card">
            <span>Developers</span>

            <strong>
              {stats.developers}
            </strong>
          </div>
        )}

        {/* =========================
            ADMIN LIVE ONLINE COUNT
        ========================= */}

        {data.role === "ADMIN" && (
          <div className="stat-card">
            <span>Online Users</span>

            <strong>
              {onlineCount}
            </strong>
          </div>
        )}
      </div>

      {/* =========================
          PROJECT MANAGER
      ========================= */}

      {data.role ===
        "PROJECT_MANAGER" &&
        data.tasksByPriority && (
          <>
            <div className="section-heading">
              <div>
                <p className="eyebrow">
                  PRIORITY
                </p>

                <h2>
                  Tasks by Priority
                </h2>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <span>Critical</span>

                <strong>
                  {
                    data
                      .tasksByPriority
                      .CRITICAL
                  }
                </strong>
              </div>

              <div className="stat-card">
                <span>High</span>

                <strong>
                  {
                    data
                      .tasksByPriority
                      .HIGH
                  }
                </strong>
              </div>

              <div className="stat-card">
                <span>Medium</span>

                <strong>
                  {
                    data
                      .tasksByPriority
                      .MEDIUM
                  }
                </strong>
              </div>

              <div className="stat-card">
                <span>Low</span>

                <strong>
                  {
                    data
                      .tasksByPriority
                      .LOW
                  }
                </strong>
              </div>
            </div>

            {/* =========================
                UPCOMING TASKS
            ========================= */}

            <div className="section-heading">
              <div>
                <p className="eyebrow">
                  UPCOMING
                </p>

                <h2>
                  Due This Week
                </h2>
              </div>
            </div>

            <div className="dashboard-list">
              {data.upcomingTasks &&
              data.upcomingTasks.length >
                0 ? (
                data.upcomingTasks.map(
                  (task) => (
                    <div
                      className="dashboard-list-item"
                      key={task.id}
                    >
                      <div>
                        <strong>
                          {task.title}
                        </strong>

                        <p className="muted">
                          {
                            task.projectName
                          }
                        </p>

                        {task.assignedDeveloper && (
                          <p className="muted">
                            Assigned to:{" "}
                            {
                              task
                                .assignedDeveloper
                                .name
                            }
                          </p>
                        )}
                      </div>

                      <div>
                        <span className="role-badge">
                          {
                            task.priority
                          }
                        </span>

                        <p className="muted">
                          {task.dueDate
                            ? new Date(
                                task.dueDate
                              ).toLocaleDateString()
                            : "No due date"}
                        </p>
                      </div>
                    </div>
                  )
                )
              ) : (
                <p className="muted">
                  No upcoming tasks due
                  this week.
                </p>
              )}
            </div>
          </>
        )}

      {/* =========================
          DEVELOPER
      ========================= */}

      {data.role ===
        "DEVELOPER" && (
        <>
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                MY WORK
              </p>

              <h2>
                Assigned Tasks
              </h2>

              <p className="muted">
                Sorted by priority and
                then due date.
              </p>
            </div>
          </div>

          <div className="dashboard-list">
            {data.tasks &&
            data.tasks.length > 0 ? (
              data.tasks.map(
                (task) => (
                  <div
                    className="dashboard-list-item"
                    key={task.id}
                  >
                    <div>
                      <strong>
                        {task.title}
                      </strong>

                      <p className="muted">
                        {
                          task.projectName
                        }
                      </p>

                      <p className="muted">
                        Status:{" "}
                        {task.status.replace(
                          "_",
                          " "
                        )}
                      </p>
                    </div>

                    <div>
                      <span className="role-badge">
                        {
                          task.priority
                        }
                      </span>

                      <p
                        className={
                          task.isOverdue
                            ? "overdue-text"
                            : "muted"
                        }
                      >
                        {task.dueDate
                          ? new Date(
                              task.dueDate
                            ).toLocaleDateString()
                          : "No due date"}
                      </p>
                    </div>
                  </div>
                )
              )
            ) : (
              <p className="muted">
                No assigned tasks.
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}

export default Dashboard;