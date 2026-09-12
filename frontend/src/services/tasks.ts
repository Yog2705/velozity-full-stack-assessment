const API_URL = "http://localhost:5000/api";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  projectId: string;
  status: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  dueDate: string | null;
  isOverdue: boolean;
  assignedDeveloperId: string | null;

  project?: {
    id: string;
    name: string;
  };

  assignedDeveloper?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

const getToken = () => window.token;

async function handleResponse(response: Response) {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data.data;
}

export const getTasks = async (filters?: {
  status?: string;
  priority?: string;
  overdue?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
}): Promise<Task[]> => {
  const params = new URLSearchParams();

  if (filters?.status) {
    params.set("status", filters.status);
  }

  if (filters?.priority) {
    params.set("priority", filters.priority);
  }

  if (filters?.overdue) {
    params.set("overdue", filters.overdue);
  }

  if (filters?.dueDateFrom) {
    params.set("dueDateFrom", filters.dueDateFrom);
  }

  if (filters?.dueDateTo) {
    params.set("dueDateTo", filters.dueDateTo);
  }

  const query = params.toString();

  const response = await fetch(
    `${API_URL}/tasks${query ? `?${query}` : ""}`,
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    }
  );

  return handleResponse(response);
};

export const createTask = async (task: {
  title: string;
  description?: string | null;
  projectId: string;
  assignedDeveloperId?: string | null;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  dueDate?: string | null;
}): Promise<Task> => {
  const response = await fetch(`${API_URL}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(task),
  });

  return handleResponse(response);
};

export const updateTask = async (
  taskId: string,
  updates: {
    title?: string;
    description?: string | null;
    assignedDeveloperId?: string | null;
    status?: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
    priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    dueDate?: string | null;
  }
): Promise<Task> => {
  const response = await fetch(`${API_URL}/tasks/${taskId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(updates),
  });

  return handleResponse(response);
};

export const deleteTask = async (taskId: string): Promise<void> => {
  const response = await fetch(`${API_URL}/tasks/${taskId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  await handleResponse(response);
};