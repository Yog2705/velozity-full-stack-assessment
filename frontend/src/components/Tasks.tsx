import { useEffect, useState } from "react";
import {
  connectSocket,
  joinProject,
} from "../services/socket";

import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../services/tasks";

import type { Task } from "../services/tasks";

type UserRole =
  | "ADMIN"
  | "PROJECT_MANAGER"
  | "DEVELOPER";

interface Project {
  id: string;
  name: string;
}

interface Developer {
  id: string;
  name: string;
  email: string;
  role: string;
}

function getUserRole(): UserRole {
  const token = window.token;

  if (!token) {
    return "DEVELOPER";
  }

  try {
    const payload = JSON.parse(
      atob(
        token
          .split(".")[1]
          .replace(/-/g, "+")
          .replace(/_/g, "/")
      )
    );

    return payload.role as UserRole;
  } catch {
    return "DEVELOPER";
  }
}

function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [developers, setDevelopers] =
    useState<Developer[]>([]);

  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [overdue, setOverdue] = useState("");

  /*
   * Due-date range filters
   */
  const [dueDateFrom, setDueDateFrom] =
    useState("");
  const [dueDateTo, setDueDateTo] =
    useState("");

  const [loading, setLoading] =
    useState(true);
  const [error, setError] = useState("");

  const [showCreateForm, setShowCreateForm] =
    useState(false);
  const [creating, setCreating] =
    useState(false);

  const userRole = getUserRole();

  const canManageTasks =
    userRole === "ADMIN" ||
    userRole === "PROJECT_MANAGER";

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    projectId: "",
    assignedDeveloperId: "",
    priority: "MEDIUM" as Task["priority"],
    dueDate: "",
  });

  /*
   * =========================
   * LOAD PROJECTS
   * =========================
   */

  useEffect(() => {
    if (!canManageTasks) {
      return;
    }

    const loadProjects = async () => {
      try {
        const token = window.token;

        if (!token) {
          return;
        }

        const response = await fetch(
          "http://localhost:5000/api/projects",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load projects"
          );
        }

        setProjects(data.data || []);
      } catch (err) {
        console.error(
          "Failed to load projects:",
          err
        );
      }
    };

    loadProjects();
  }, [canManageTasks]);

  /*
   * =========================
   * LOAD TASKS
   * =========================
   */

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getTasks({
        status,
        priority,
        overdue,
        dueDateFrom,
        dueDateTo,
      });

      setTasks(data);
    } catch (err) {
      console.error(
        "Failed to load tasks:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load tasks"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [
    status,
    priority,
    overdue,
    dueDateFrom,
    dueDateTo,
  ]);

  /*
   * =========================
   * REAL-TIME TASK UPDATES
   * =========================
   */

  useEffect(() => {
    const token = window.token;

    if (!token) {
      return;
    }

    const socket = connectSocket(token);

    const handleActivity = (
      activity: any
    ) => {
      if (
        activity.type !==
        "TASK_STATUS_CHANGED"
      ) {
        return;
      }

      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === activity.taskId
            ? {
                ...task,
                status:
                  activity.newStatus,
              }
            : task
        )
      );
    };

    socket.on(
      "project:activity",
      handleActivity
    );

    /*
     * Project Managers need to join
     * their project rooms.
     */
    if (
      userRole === "PROJECT_MANAGER"
    ) {
      projects.forEach((project) => {
        joinProject(project.id);
      });
    }

    return () => {
      socket.off(
        "project:activity",
        handleActivity
      );
    };
  }, [projects, userRole]);

  /*
   * =========================
   * BUILD DEVELOPER LIST
   * =========================
   *
   * The Tasks API already returns
   * assignedDeveloper information.
   */

  useEffect(() => {
    if (!canManageTasks) {
      return;
    }

    const developerMap = new Map<
      string,
      Developer
    >();

    tasks.forEach((task) => {
      if (task.assignedDeveloper) {
        developerMap.set(
          task.assignedDeveloper.id,
          {
            id: task.assignedDeveloper.id,
            name: task.assignedDeveloper.name,
            email: task.assignedDeveloper.email,
            role: task.assignedDeveloper.role,
          }
        );
      }
    });

    setDevelopers(
      Array.from(
        developerMap.values()
      )
    );
  }, [tasks, canManageTasks]);

  /*
   * =========================
   * STATUS UPDATE
   * =========================
   */

  const handleStatusChange = async (
    taskId: string,
    newStatus: Task["status"]
  ) => {
    try {
      const updatedTask =
        await updateTask(taskId, {
          status: newStatus,
        });

      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === taskId
            ? updatedTask
            : task
        )
      );
    } catch (err) {
      console.error(
        "Failed to update task status:",
        err
      );

      alert(
        err instanceof Error
          ? err.message
          : "You are not allowed to update this task."
      );
    }
  };

  /*
   * =========================
   * CREATE TASK
   * =========================
   */

  const handleCreateTask = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!newTask.title.trim()) {
      alert("Task title is required.");
      return;
    }

    if (!newTask.projectId) {
      alert("Please select a project.");
      return;
    }

    try {
      setCreating(true);

      const createdTask =
        await createTask({
          title: newTask.title.trim(),

          description:
            newTask.description.trim() ||
            null,

          projectId: newTask.projectId,

          assignedDeveloperId:
            newTask.assignedDeveloperId ||
            null,

          priority: newTask.priority,

          dueDate: newTask.dueDate
            ? new Date(
                `${newTask.dueDate}T23:59:59`
              ).toISOString()
            : null,
        });

      setTasks((currentTasks) => [
        createdTask,
        ...currentTasks,
      ]);

      setNewTask({
        title: "",
        description: "",
        projectId: "",
        assignedDeveloperId: "",
        priority: "MEDIUM",
        dueDate: "",
      });

      setShowCreateForm(false);

      alert(
        "Task created successfully."
      );
    } catch (err) {
      console.error(
        "Failed to create task:",
        err
      );

      alert(
        err instanceof Error
          ? err.message
          : "Failed to create task."
      );
    } finally {
      setCreating(false);
    }
  };

  /*
   * =========================
   * DELETE TASK
   * =========================
   */

  const handleDeleteTask = async (
    taskId: string
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteTask(taskId);

      setTasks((currentTasks) =>
        currentTasks.filter(
          (task) => task.id !== taskId
        )
      );
    } catch (err) {
      console.error(
        "Failed to delete task:",
        err
      );

      alert(
        err instanceof Error
          ? err.message
          : "Failed to delete task."
      );
    }
  };

  /*
   * =========================
   * CLEAR FILTERS
   * =========================
   */

  const clearFilters = () => {
    setStatus("");
    setPriority("");
    setOverdue("");
    setDueDateFrom("");
    setDueDateTo("");
  };

  /*
   * =========================
   * UI
   * =========================
   */

  return (
    <section>
      {/* =========================
          HEADER
      ========================= */}

      <div className="page-heading">
        <div>
          <p className="eyebrow">
            WORK MANAGEMENT
          </p>

          <h1>Tasks</h1>

          <p className="muted">
            {userRole === "DEVELOPER"
              ? "View and update your assigned tasks."
              : "Create, assign and manage project tasks."}
          </p>
        </div>

        {canManageTasks && (
          <button
            className="primary-button"
            onClick={() =>
              setShowCreateForm(
                !showCreateForm
              )
            }
          >
            {showCreateForm
              ? "Cancel"
              : "+ Create Task"}
          </button>
        )}
      </div>

      {/* =========================
          CREATE TASK FORM
      ========================= */}

      {showCreateForm &&
        canManageTasks && (
          <div className="form-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">
                  NEW TASK
                </p>

                <h2>Create Task</h2>
              </div>
            </div>

            <form
              onSubmit={handleCreateTask}
            >
              <div className="form-grid">
                {/* TITLE */}

                <div className="form-group">
                  <label htmlFor="task-title">
                    Task Title
                  </label>

                  <input
                    id="task-title"
                    type="text"
                    value={newTask.title}
                    placeholder="Enter task title"
                    onChange={(e) =>
                      setNewTask({
                        ...newTask,
                        title: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                {/* PROJECT */}

                <div className="form-group">
                  <label htmlFor="task-project">
                    Project
                  </label>

                  <select
                    id="task-project"
                    value={
                      newTask.projectId
                    }
                    onChange={(e) =>
                      setNewTask({
                        ...newTask,
                        projectId:
                          e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">
                      Select Project
                    </option>

                    {projects.map(
                      (project) => (
                        <option
                          key={project.id}
                          value={project.id}
                        >
                          {project.name}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* DEVELOPER */}

                <div className="form-group">
                  <label htmlFor="task-developer">
                    Assign Developer
                  </label>

                  <select
                    id="task-developer"
                    value={
                      newTask.assignedDeveloperId
                    }
                    onChange={(e) =>
                      setNewTask({
                        ...newTask,
                        assignedDeveloperId:
                          e.target.value,
                      })
                    }
                  >
                    <option value="">
                      Unassigned
                    </option>

                    {developers.map(
                      (developer) => (
                        <option
                          key={developer.id}
                          value={developer.id}
                        >
                          {developer.name}
                        </option>
                      )
                    )}
                  </select>

                  {developers.length ===
                    0 && (
                    <small className="muted">
                      Developers will appear
                      after tasks are loaded.
                    </small>
                  )}
                </div>

                {/* PRIORITY */}

                <div className="form-group">
                  <label htmlFor="task-priority">
                    Priority
                  </label>

                  <select
                    id="task-priority"
                    value={
                      newTask.priority
                    }
                    onChange={(e) =>
                      setNewTask({
                        ...newTask,
                        priority:
                          e.target.value as Task["priority"],
                      })
                    }
                  >
                    <option value="LOW">
                      Low
                    </option>

                    <option value="MEDIUM">
                      Medium
                    </option>

                    <option value="HIGH">
                      High
                    </option>

                    <option value="CRITICAL">
                      Critical
                    </option>
                  </select>
                </div>

                {/* DUE DATE */}

                <div className="form-group">
                  <label htmlFor="task-due-date">
                    Due Date
                  </label>

                  <input
                    id="task-due-date"
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) =>
                      setNewTask({
                        ...newTask,
                        dueDate:
                          e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {/* DESCRIPTION */}

              <div className="form-group">
                <label htmlFor="task-description">
                  Description
                </label>

                <textarea
                  id="task-description"
                  value={
                    newTask.description
                  }
                  placeholder="Describe the task..."
                  rows={4}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      description:
                        e.target.value,
                    })
                  }
                />
              </div>

              <button
                type="submit"
                className="primary-button"
                disabled={creating}
              >
                {creating
                  ? "Creating..."
                  : "Create Task"}
              </button>
            </form>
          </div>
        )}

      {/* =========================
          FILTERS
      ========================= */}

      <div className="filters">
        {/* STATUS */}

        <select
          value={status}
          onChange={(e) =>
            setStatus(e.target.value)
          }
          aria-label="Filter by status"
        >
          <option value="">
            All Statuses
          </option>

          <option value="TODO">
            To Do
          </option>

          <option value="IN_PROGRESS">
            In Progress
          </option>

          <option value="IN_REVIEW">
            In Review
          </option>

          <option value="DONE">
            Done
          </option>
        </select>

        {/* PRIORITY */}

        <select
          value={priority}
          onChange={(e) =>
            setPriority(e.target.value)
          }
          aria-label="Filter by priority"
        >
          <option value="">
            All Priorities
          </option>

          <option value="LOW">
            Low
          </option>

          <option value="MEDIUM">
            Medium
          </option>

          <option value="HIGH">
            High
          </option>

          <option value="CRITICAL">
            Critical
          </option>
        </select>

        {/* OVERDUE */}

        <select
          value={overdue}
          onChange={(e) =>
            setOverdue(e.target.value)
          }
          aria-label="Filter by overdue status"
        >
          <option value="">
            All Tasks
          </option>

          <option value="true">
            Overdue
          </option>

          <option value="false">
            Not Overdue
          </option>
        </select>

        {/* DUE DATE FROM */}

        <div className="form-group">
          <label
            htmlFor="filter-due-date-from"
            style={{
              fontSize: "12px",
              marginBottom: "4px",
            }}
          >
            Due From
          </label>

          <input
            id="filter-due-date-from"
            type="date"
            value={dueDateFrom}
            onChange={(e) =>
              setDueDateFrom(
                e.target.value
              )
            }
            aria-label="Due date from"
          />
        </div>

        {/* DUE DATE TO */}

        <div className="form-group">
          <label
            htmlFor="filter-due-date-to"
            style={{
              fontSize: "12px",
              marginBottom: "4px",
            }}
          >
            Due To
          </label>

          <input
            id="filter-due-date-to"
            type="date"
            value={dueDateTo}
            onChange={(e) =>
              setDueDateTo(
                e.target.value
              )
            }
            aria-label="Due date to"
          />
        </div>

        {/* CLEAR */}

        {(status ||
          priority ||
          overdue ||
          dueDateFrom ||
          dueDateTo) && (
          <button
            type="button"
            className="secondary-button"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* =========================
          ERROR
      ========================= */}

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      {/* =========================
          TASK LIST
      ========================= */}

      {loading ? (
        <div className="empty-state">
          Loading tasks...
        </div>
      ) : (
        <div className="task-list">
          {tasks.length === 0 ? (
            <div className="empty-state">
              No tasks found.
            </div>
          ) : (
            tasks.map((task) => (
              <article
                className="task-card"
                key={task.id}
              >
                {/* TASK INFORMATION */}

                <div>
                  <h3>{task.title}</h3>

                  {task.description && (
                    <p className="muted">
                      {task.description}
                    </p>
                  )}

                  <p className="task-meta">
                    Project:{" "}
                    {task.project?.name ||
                      "Unknown"}
                  </p>

                  {task.assignedDeveloper && (
                    <p className="task-meta">
                      Developer:{" "}
                      {
                        task
                          .assignedDeveloper
                          .name
                      }
                    </p>
                  )}

                  {task.dueDate && (
                    <p className="task-meta">
                      Due:{" "}
                      {new Date(
                        task.dueDate
                      ).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* TASK CONTROLS */}

                <div className="task-badges">
                  <select
                    value={task.status}
                    onChange={(e) =>
                      handleStatusChange(
                        task.id,
                        e.target
                          .value as Task["status"]
                      )
                    }
                    className="status-select"
                  >
                    <option value="TODO">
                      To Do
                    </option>

                    <option value="IN_PROGRESS">
                      In Progress
                    </option>

                    <option value="IN_REVIEW">
                      In Review
                    </option>

                    <option value="DONE">
                      Done
                    </option>
                  </select>

                  <span
                    className={`badge priority-${task.priority}`}
                  >
                    {task.priority}
                  </span>

                  {task.isOverdue && (
                    <span className="badge overdue">
                      OVERDUE
                    </span>
                  )}

                  {canManageTasks && (
                    <button
                      className="danger-button"
                      onClick={() =>
                        handleDeleteTask(
                          task.id
                        )
                      }
                    >
                      Delete
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </section>
  );
}

export default Tasks;