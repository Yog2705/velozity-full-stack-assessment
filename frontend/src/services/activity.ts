import {
  getSocket,
  joinProject,
  leaveProject,
  requestMissedActivity,
} from "./socket";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

export interface Activity {
  id: string;
  projectId: string;
  taskId?: string | null;
  userId: string;
  type: string;
  oldStatus?: string | null;
  newStatus?: string | null;
  createdAt: string;

  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };

  task?: {
    id: string;
    title: string;
    status: string;
  };

  project?: {
    id: string;
    name: string;
  };
}

export const getProjectActivity = async (
  projectId: string,
  token: string,
  since?: string
) => {
  const query = since
    ? `?since=${encodeURIComponent(since)}`
    : "";

  const response = await fetch(
    `${API_URL}/projects/${projectId}/activity${query}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to fetch activity"
    );
  }

  return data.data as Activity[];
};

export const getGlobalActivity = async (
  token: string,
  since?: string
) => {
  const query = since
    ? `?since=${encodeURIComponent(since)}`
    : "";

  const response = await fetch(
    `${API_URL}/activity${query}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to fetch global activity"
    );
  }

  return data.data as Activity[];
};

export const markActivitySeen = async (
  token: string
) => {
  const response = await fetch(
    `${API_URL}/activity/seen`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to update activity timestamp"
    );
  }

  return data.data;
};

export const subscribeToProjectActivity = (
  projectId: string,
  callback: (activity: Activity) => void,
  missedCallback?: (
    activities: Activity[]
  ) => void,
  presenceCallback?: (
    onlineCount: number
  ) => void
) => {
  const socket = getSocket();

  if (!socket) {
    return () => {};
  }

  joinProject(projectId);

  const lastSeen = localStorage.getItem(
    `activitySeen:${projectId}`
  );

  requestMissedActivity(
    projectId,
    lastSeen || undefined
  );

  const handleActivity = (
    activity: Activity
  ) => {
    callback(activity);

    localStorage.setItem(
      `activitySeen:${projectId}`,
      activity.createdAt
    );
  };

  const handleMissed = (
    activities: Activity[]
  ) => {
    if (activities.length === 0) {
      return;
    }

    missedCallback?.(activities);

    const latest =
      activities[activities.length - 1];

    localStorage.setItem(
      `activitySeen:${projectId}`,
      latest.createdAt
    );
  };

  const handlePresence = ({
    onlineCount,
  }: {
    onlineCount: number;
  }) => {
    presenceCallback?.(onlineCount);
  };

  socket.on(
    "project:activity",
    handleActivity
  );

  socket.on(
    "activity:missed",
    handleMissed
  );

  socket.on(
    "presence:update",
    handlePresence
  );

  return () => {
    socket.off(
      "project:activity",
      handleActivity
    );

    socket.off(
      "activity:missed",
      handleMissed
    );

    socket.off(
      "presence:update",
      handlePresence
    );

    leaveProject(projectId);
  };
};