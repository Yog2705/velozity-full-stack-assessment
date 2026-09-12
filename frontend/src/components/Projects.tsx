import { useEffect, useState } from "react";

interface Project {
  id: string;
  name: string;
  description: string | null;
  clientId: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

interface Client {
  id: string;
  name: string;
}

function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState("");

 const getUserRole = (): string | null => {
  try {
    const token = window.token;

    if (!token) return null;

    const payload = JSON.parse(
      atob(token.split(".")[1])
    );

    return payload.role || null;
  } catch {
    return null;
  }
};

const role = getUserRole();

const canManageProjects =
  role === "ADMIN" || role === "PROJECT_MANAGER";
  const loadProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const token = window.token;

      if (!token) {
        throw new Error("Please log in again.");
      }

      const response = await fetch(
        "http://localhost:5000/api/projects",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load projects");
      }

      setProjects(data.data || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load projects"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const token = window.token;

      if (!token || !canManageProjects) return;

      const response = await fetch(
        "http://localhost:5000/api/clients",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load clients");
      }

      setClients(data.data || []);
    } catch (err) {
      console.error("CLIENT LOAD ERROR:", err);
    }
  };

  useEffect(() => {
    loadProjects();
    loadClients();
  }, []);

  const resetForm = () => {
    setProjectName("");
    setDescription("");
    setClientId("");
    setEditingProject(null);
    setShowCreate(false);
  };

  const handleCreate = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!projectName.trim()) {
      setError("Project name is required.");
      return;
    }

    if (!clientId) {
      setError("Please select a client.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        "http://localhost:5000/api/projects",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${window.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: projectName.trim(),
            clientId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create project"
        );
      }

      setProjects((current) => [
        data.data,
        ...current,
      ]);

      setSuccess("Project created successfully.");
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create project"
      );
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (project: Project) => {
    setEditingProject(project);
    setProjectName(project.name);
    setDescription(project.description || "");
    setClientId(project.clientId || "");

    setShowCreate(false);
    setError("");
    setSuccess("");
  };

  const handleUpdate = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!editingProject) return;

    if (!projectName.trim()) {
      setError("Project name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `http://localhost:5000/api/projects/${editingProject.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${window.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: projectName.trim(),
            description: description.trim() || null,
            ...(clientId ? { clientId } : {}),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update project"
        );
      }

      setProjects((current) =>
        current.map((project) =>
          project.id === editingProject.id
            ? data.data
            : project
        )
      );

      setSuccess("Project updated successfully.");
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update project"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (project: Project) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${project.name}"?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `http://localhost:5000/api/projects/${project.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${window.token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete project"
        );
      }

      setProjects((current) =>
        current.filter(
          (item) => item.id !== project.id
        )
      );

      setSuccess("Project deleted successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete project"
      );
    }
  };

  if (loading) {
    return (
      <section>
        <div className="page-heading">
          <div>
            <p className="eyebrow">WORKSPACE</p>
            <h1>Projects</h1>
          </div>
        </div>

        <div className="empty-state">
          Loading projects...
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <p className="eyebrow">WORKSPACE</p>
          <h1>Projects</h1>
          <p className="muted">
            Manage projects and client assignments.
          </p>
        </div>

        {canManageProjects && (
          <button
            className="primary-button"
            onClick={() => {
              resetForm();
              setShowCreate(true);
            }}
          >
            + Create Project
          </button>
        )}
      </div>

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      {success && (
        <div className="success-box">
          {success}
        </div>
      )}

      {canManageProjects &&
        (showCreate || editingProject) && (
          <div className="project-form-card">
            <div className="form-header">
              <div>
                <p className="eyebrow">
                  {editingProject
                    ? "EDIT PROJECT"
                    : "NEW PROJECT"}
                </p>

                <h2>
                  {editingProject
                    ? "Edit Project"
                    : "Create New Project"}
                </h2>
              </div>

              <button
                className="secondary-button"
                type="button"
                onClick={resetForm}
              >
                Cancel
              </button>
            </div>

            <form
              onSubmit={
                editingProject
                  ? handleUpdate
                  : handleCreate
              }
              className="project-form"
            >
              <label>
                Project Name

                <input
                  type="text"
                  value={projectName}
                  onChange={(event) =>
                    setProjectName(event.target.value)
                  }
                  placeholder="Enter project name"
                  maxLength={150}
                  required
                />
              </label>

              {editingProject && (
                <label>
                  Description

                  <textarea
                    value={description}
                    onChange={(event) =>
                      setDescription(event.target.value)
                    }
                    placeholder="Enter project description"
                    maxLength={1000}
                    rows={4}
                  />
                </label>
              )}

              <label>
                Client

                <select
                  value={clientId}
                  onChange={(event) =>
                    setClientId(event.target.value)
                  }
                  required={!editingProject}
                >
                  <option value="">
                    Select a client
                  </option>

                  {clients.map((client) => (
                    <option
                      key={client.id}
                      value={client.id}
                    >
                      {client.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="form-actions">
                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingProject
                      ? "Save Changes"
                      : "Create Project"}
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

      {!error && projects.length === 0 && (
        <div className="empty-state">
          No projects found.
        </div>
      )}

      {!error && projects.length > 0 && (
        <div className="project-grid">
          {projects.map((project) => {
            const client = clients.find(
              (item) => item.id === project.clientId
            );

            return (
              <article
                className="project-card"
                key={project.id}
              >
                <div className="project-card-top">
                  <div className="project-icon">
                    P
                  </div>

                  {canManageProjects && (
                    <div className="project-actions">
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() =>
                          openEdit(project)
                        }
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="icon-button danger"
                        onClick={() =>
                          handleDelete(project)
                        }
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                <h3>{project.name}</h3>

                <p className="muted">
                  {project.description ||
                    "No description available."}
                </p>

                <div className="project-meta">
                  <span>
                    <strong>Client:</strong>{" "}
                    {client?.name ||
                      "Assigned client"}
                  </span>

                  <small>
                    Created{" "}
                    {new Date(
                      project.createdAt
                    ).toLocaleDateString()}
                  </small>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default Projects;