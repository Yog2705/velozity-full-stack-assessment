const API_URL = "http://localhost:5000/api";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  clientId: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;

  client?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  };

  createdBy?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

const getToken = () => window.token;

export const getProjects = async (): Promise<Project[]> => {
  const response = await fetch(
    `${API_URL}/projects`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        Accept: "application/json",
      },
    }
  );

  const text = await response.text();

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      "Server returned an invalid response. Please check that the backend is running on port 5000."
    );
  }

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to load projects"
    );
  }

  return data.data;
};