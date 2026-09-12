import { useEffect, useState } from "react";

import {
  login,
  logout,
  refreshAccessToken,
} from "./services/api";

import Dashboard from "./components/Dashboard";
import Tasks from "./components/Tasks";
import Projects from "./components/Projects";
import Notifications from "./components/Notifications";
import ActivityFeed from "./components/ActivityFeed";

type Page =
  | "dashboard"
  | "projects"
  | "tasks"
  | "notifications"
  | "activity";

type User = {
  name: string;
  role: string;
};

function App() {
  const [user, setUser] = useState<User | null>(
    null
  );

  const [checkingSession, setCheckingSession] =
    useState(true);

  const [page, setPage] =
    useState<Page>("dashboard");

  const [email, setEmail] = useState(
    "admin@test.com"
  );

  const [password, setPassword] = useState(
    "password123"
  );

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /*
   * =========================
   * RESTORE SESSION
   * =========================
   *
   * The access token is intentionally kept
   * only in memory. After a browser refresh,
   * obtain a new access token using the
   * HttpOnly refresh-token cookie.
   */

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const data = await refreshAccessToken();

        window.token = data.data.accessToken;
        setUser(data.data.user);
      } catch {
        // No valid refresh token.
        // User must log in normally.
        window.token = undefined;
        setUser(null);
      } finally {
        setCheckingSession(false);
      }
    };

    restoreSession();
  }, []);

  /*
   * =========================
   * LOGIN
   * =========================
   */

  const handleLogin = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const data = await login(
        email,
        password
      );

      // Store ONLY the short-lived access token.
      // Refresh token is kept in an HttpOnly cookie.
      window.token = data.data.accessToken;

      setUser(data.data.user);
      setPage("dashboard");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * =========================
   * LOGOUT
   * =========================
   */

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error(error);
    }

    window.token = undefined;
    setUser(null);
    setPage("dashboard");
  };

  /*
   * =========================
   * SESSION CHECK
   * =========================
   */

  if (checkingSession) {
    return (
      <main className="login-page">
        <div className="login-card">
          <div className="brand-mark">
            V
          </div>

          <p className="eyebrow">
            VELOZITY GLOBAL SOLUTIONS
          </p>

          <h1>Project Workspace</h1>

          <p className="muted">
            Restoring your session...
          </p>
        </div>
      </main>
    );
  }

  /*
   * =========================
   * LOGIN SCREEN
   * =========================
   */

  if (!user) {
    return (
      <main className="login-page">
        <div className="login-card">
          <div className="brand-mark">
            V
          </div>

          <p className="eyebrow">
            VELOZITY GLOBAL SOLUTIONS
          </p>

          <h1>Project Workspace</h1>

          <p className="muted">
            Sign in to manage projects,
            tasks and activity.
          </p>

          <form onSubmit={handleLogin}>
            <label>Email</label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
            />

            <label>Password</label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
            />

            {error && (
              <div className="error-box">
                {error}
              </div>
            )}

            <button
              className="primary-button login-button"
              disabled={loading}
            >
              {loading
                ? "Signing in..."
                : "Sign in"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  /*
   * =========================
   * ROLE PERMISSIONS
   * =========================
   */

  const isAdmin =
    user.role === "ADMIN";

  const isProjectManager =
    user.role === "PROJECT_MANAGER";

  const canManageProjects =
    isAdmin || isProjectManager;

  /*
   * =========================
   * APPLICATION
   * =========================
   */

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">
            V
          </div>

          <div>
            <strong>Velozity</strong>
            <span>Workspace</span>
          </div>
        </div>

        <nav>
          <button
            className={
              page === "dashboard"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setPage("dashboard")
            }
          >
            Dashboard
          </button>

          {/* Only Admin and Project Managers
              can access Projects */}
          {canManageProjects && (
            <button
              className={
                page === "projects"
                  ? "nav-item active"
                  : "nav-item"
              }
              onClick={() =>
                setPage("projects")
              }
            >
              Projects
            </button>
          )}

          <button
            className={
              page === "tasks"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setPage("tasks")
            }
          >
            Tasks
          </button>

          <button
            className={
              page === "notifications"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setPage("notifications")
            }
          >
            Notifications
          </button>

          <button
            className={
              page === "activity"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setPage("activity")
            }
          >
            Live Activity
          </button>
        </nav>

        <div className="sidebar-user">
          <strong>{user.name}</strong>

          <span>
            {user.role.replace("_", " ")}
          </span>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        {page === "dashboard" && (
          <Dashboard
            userName={user.name}
          />
        )}

        {/* Extra frontend protection:
            Developers cannot render the Projects page
            even if page state is somehow changed. */}
        {page === "projects" &&
          canManageProjects && (
            <Projects />
          )}

        {page === "tasks" && <Tasks />}

        {page === "notifications" && (
          <Notifications />
        )}

        {page === "activity" && (
          <ActivityFeed
            token={window.token ?? ""}
          />
        )}
      </main>
    </div>
  );
}

export default App;