const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface LoginResponse {
  success: boolean;
  data: {
    accessToken: string;
    user: {
      id: string;
      name: string;
      email: string;
      role: "ADMIN" | "PROJECT_MANAGER" | "DEVELOPER";
    };
  };
}

export const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  return data;
};

export const refreshAccessToken = async () => {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Session expired");
  }

  return data;
};

export const logout = async () => {
  const response = await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Logout failed");
  }

  return response.json();
};

export const getDashboard = async (token: string) => {
  const response = await fetch(`${API_URL}/dashboard`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        `Dashboard request failed (${response.status})`
    );
  }

  return data;
};

export const apiRequest = async <T>(
  endpoint: string,
  token: string,
  options: RequestInit = {},
  onTokenRefresh?: (token: string) => void
): Promise<T> => {
  const makeRequest = async (accessToken: string) => {
    return fetch(`${API_URL}${endpoint}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        Authorization: `Bearer ${accessToken}`,
      },
    });
  };

  let response = await makeRequest(token);

  if (response.status === 401 && onTokenRefresh) {
    try {
      const refreshed = await refreshAccessToken();

      const newAccessToken = refreshed.data.accessToken;

      onTokenRefresh(newAccessToken);

      response = await makeRequest(newAccessToken);
    } catch {
      throw new Error(
        "Session expired. Please login again."
      );
    }
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
};