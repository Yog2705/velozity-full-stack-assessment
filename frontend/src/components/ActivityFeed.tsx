import { useEffect, useState } from "react";

import {
  getProjectActivity,
  getGlobalActivity,
  markActivitySeen,
  subscribeToProjectActivity,
  type Activity,
} from "../services/activity";

import {
  connectSocket,
  requestMissedGlobalActivity,
} from "../services/socket";

interface ActivityFeedProps {
  token: string;
  projectId?: string;
  role?: string;
}

const ActivityFeed = ({
  token,
  projectId,
  role,
}: ActivityFeedProps) => {
  const [activities, setActivities] =
    useState<Activity[]>([]);

  const [onlineCount, setOnlineCount] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cleanup = () => {};

    const loadActivity = async () => {
      try {
        const socket = connectSocket(token);

        /*
         * =========================
         * PROJECT-SPECIFIC FEED
         * =========================
         */
        if (projectId) {
          const existing =
            await getProjectActivity(
              projectId,
              token
            );

          setActivities(existing);

          cleanup =
            subscribeToProjectActivity(
              projectId,
              (activity) => {
                setActivities(
                  (current) => {
                    if (
                      current.some(
                        (item) =>
                          item.id ===
                          activity.id
                      )
                    ) {
                      return current;
                    }

                    return [
                      ...current,
                      activity,
                    ];
                  }
                );
              },

              (missedActivities) => {
                setActivities(
                  (current) => {
                    const merged = [
                      ...current,
                    ];

                    for (
                      const activity of missedActivities
                    ) {
                      if (
                        !merged.some(
                          (item) =>
                            item.id ===
                            activity.id
                        )
                      ) {
                        merged.push(
                          activity
                        );
                      }
                    }

                    return merged;
                  }
                );
              },

              (count) => {
                setOnlineCount(count);
              }
            );

          return;
        }

        /*
         * =========================
         * ADMIN GLOBAL FEED
         * =========================
         */

        if (role === "ADMIN") {
          /*
           * Load the latest 20 global
           * activities from the database.
           */
          const existing =
            await getGlobalActivity(
              token
            );

          setActivities(existing);

          /*
           * Listen for new global activity.
           */
          const handleActivity = (
            activity: Activity
          ) => {
            setActivities(
              (current) => {
                if (
                  current.some(
                    (item) =>
                      item.id ===
                      activity.id
                  )
                ) {
                  return current;
                }

                return [
                  ...current,
                  activity,
                ].slice(-20);
              }
            );
          };

          /*
           * Receive missed global activity
           * after reconnecting.
           */
          const handleMissedGlobal = (
            missedActivities: Activity[]
          ) => {
            setActivities(
              (current) => {
                const merged = [
                  ...current,
                ];

                for (
                  const activity of missedActivities
                ) {
                  if (
                    !merged.some(
                      (item) =>
                        item.id ===
                        activity.id
                    )
                  ) {
                    merged.push(
                      activity
                    );
                  }
                }

                return merged.slice(-20);
              }
            );
          };

          const handlePresence = ({
            onlineCount,
          }: {
            onlineCount: number;
          }) => {
            setOnlineCount(
              onlineCount
            );
          };

          socket.on(
            "project:activity",
            handleActivity
          );

          socket.on(
            "activity:missed-global",
            handleMissedGlobal
          );

          socket.on(
            "presence:update",
            handlePresence
          );

          /*
           * Request missed global activity
           * using the last activity timestamp.
           */
          const lastSeen =
            localStorage.getItem(
              "activitySeen:global"
            );

          requestMissedGlobalActivity(
            lastSeen || undefined
          );

          cleanup = () => {
            socket.off(
              "project:activity",
              handleActivity
            );

            socket.off(
              "activity:missed-global",
              handleMissedGlobal
            );

            socket.off(
              "presence:update",
              handlePresence
            );
          };

          return;
        }

        /*
         * =========================
         * NON-ADMIN GLOBAL FEED
         * =========================
         */

        const handleActivity = (
          activity: Activity
        ) => {
          setActivities(
            (current) => {
              if (
                current.some(
                  (item) =>
                    item.id ===
                    activity.id
                )
              ) {
                return current;
              }

              return [
                ...current,
                activity,
              ].slice(-20);
            }
          );
        };

        const handlePresence = ({
          onlineCount,
        }: {
          onlineCount: number;
        }) => {
          setOnlineCount(
            onlineCount
          );
        };

        socket.on(
          "project:activity",
          handleActivity
        );

        socket.on(
          "presence:update",
          handlePresence
        );

        cleanup = () => {
          socket.off(
            "project:activity",
            handleActivity
          );

          socket.off(
            "presence:update",
            handlePresence
          );
        };
      } catch (error) {
        console.error(
          "Activity feed error:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadActivity();

    return () => {
      cleanup();

      /*
       * IMPORTANT:
       * Do NOT disconnect the shared socket here.
       *
       * Tasks, Notifications and other components
       * may be using the same Socket.IO connection.
       */
    };
  }, [token, projectId, role]);

  /*
   * =========================
   * MARK ACTIVITY AS SEEN
   * =========================
   */

  useEffect(() => {
    if (token) {
      markActivitySeen(token).catch(
        (error) => {
          console.error(
            "Failed to update activity seen timestamp:",
            error
          );
        }
      );
    }
  }, [token]);

  if (loading) {
    return (
      <div className="card">
        <h2>Live Activity</h2>
        <p>Loading activity...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="section-header">
        <div>
          <h2>Live Activity</h2>

          <p>
            Real-time activity powered by
            WebSockets.
          </p>
        </div>

        <div>
          <span className="live-badge">
            ● LIVE
          </span>

          <span
            style={{
              marginLeft: "12px",
              fontSize: "14px",
            }}
          >
            🟢 {onlineCount} online
          </span>
        </div>
      </div>

      {activities.length === 0 ? (
        <p>No activity found.</p>
      ) : (
        <div className="activity-list">
          {activities
            .slice()
            .reverse()
            .map((activity) => (
              <div
                className="activity-item"
                key={activity.id}
              >
                <div>
                  <strong>
                    {activity.type}
                  </strong>

                  <p>
                    {activity.user?.name ||
                      "User"}{" "}
                    performed this activity
                    {activity.project?.name
                      ? ` in "${activity.project.name}"`
                      : ""}
                    {activity.task?.title
                      ? ` on "${activity.task.title}"`
                      : ""}
                  </p>
                </div>

                <small>
                  {new Date(
                    activity.createdAt
                  ).toLocaleString()}
                </small>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;