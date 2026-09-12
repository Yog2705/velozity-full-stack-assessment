const API_URL = "http://localhost:5000/api";

export interface Notification {
  id: string;
  userId: string;
  taskId: string | null;
  message: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  task?: {
    id: string;
    title: string;
    status: string;
    priority: string;
  } | null;
}

const getToken = () => {
  return window.token;
};

export const getNotifications =
  async (): Promise<Notification[]> => {
    const response = await fetch(
      `${API_URL}/notifications`,
      {
        headers: {
          Authorization:
            "Bearer " + getToken(),
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to fetch notifications"
      );
    }

    return data.data;
  };

export const markNotificationAsRead =
  async (notificationId: string) => {
    const response = await fetch(
      `${API_URL}/notifications/${notificationId}/read`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Bearer " + getToken(),
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to mark notification as read"
      );
    }

    return data.data;
  };

export const markAllNotificationsAsRead =
  async () => {
    const response = await fetch(
      `${API_URL}/notifications/read-all`,
      {
        method: "PATCH",
        headers: {
          Authorization:
            "Bearer " + getToken(),
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to mark notifications as read"
      );
    }

    return data;
  };