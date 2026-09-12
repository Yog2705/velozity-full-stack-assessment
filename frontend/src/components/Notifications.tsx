import { useEffect, useState } from "react";

import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notification";

import type { Notification } from "../services/notification";

import {
  connectSocket,
} from "../services/socket";

function Notifications() {
  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const token = window.token;

    if (!token) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const load = async () => {
      try {
        const data = await getNotifications();

        if (mounted) {
          setNotifications(data);
        }
      } catch (error) {
        console.error(
          "Notification loading error:",
          error
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    const socket = connectSocket(token);

    const handleNotification = (
      notification: Notification
    ) => {
      setNotifications((current) => {
        if (
          current.some(
            (item) => item.id === notification.id
          )
        ) {
          return current;
        }

        return [notification, ...current];
      });
    };

    socket.on(
      "notification:new",
      handleNotification
    );

    return () => {
      mounted = false;

      socket.off(
        "notification:new",
        handleNotification
      );

    };
  }, []);

  const unreadCount =
    notifications.filter(
      (notification) => !notification.isRead
    ).length;

  const markRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id
            ? {
                ...notification,
                isRead: true,
                readAt: new Date().toISOString(),
              }
            : notification
        )
      );
    } catch (error) {
      console.error(
        "Mark notification read error:",
        error
      );
    }
  };

  const markAllRead = async () => {
    try {
      await markAllNotificationsAsRead();

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
          readAt: new Date().toISOString(),
        }))
      );
    } catch (error) {
      console.error(
        "Mark all notifications read error:",
        error
      );
    }
  };

  if (loading) {
    return (
      <section>
        <div className="page-heading">
          <div>
            <p className="eyebrow">UPDATES</p>
            <h1>Notifications</h1>
          </div>
        </div>

        <div className="empty-state">
          Loading notifications...
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <p className="eyebrow">UPDATES</p>

          <h1>Notifications</h1>

          <p className="muted">
            Stay updated with task assignments and
            project activity.
          </p>
        </div>

        <div className="notification-dropdown-wrapper">
          <button
            type="button"
            className="notification-bell-button"
            onClick={() => setOpen((current) => !current)}
            aria-label="Open notifications"
            aria-expanded={open}
          >
            🔔

            {unreadCount > 0 && (
              <span className="notification-badge">
                {unreadCount > 99
                  ? "99+"
                  : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className="notification-dropdown">
              <div className="notification-dropdown-header">
                <div>
                  <strong>Notifications</strong>

                  <span className="muted">
                    {unreadCount} unread
                  </span>
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="text-button"
                    onClick={markAllRead}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="notification-dropdown-list">
                {notifications.length === 0 ? (
                  <div className="notification-empty">
                    No notifications.
                  </div>
                ) : (
                  notifications
                    .slice(0, 20)
                    .map((notification) => (
                      <article
                        className={`notification-dropdown-item ${
                          notification.isRead
                            ? ""
                            : "unread"
                        }`}
                        key={notification.id}
                      >
                        <div className="notification-content">
                          <p>
                            {notification.message}
                          </p>

                          {notification.task && (
                            <small>
                              Task:{" "}
                              {notification.task.title}
                            </small>
                          )}

                          <small>
                            {new Date(
                              notification.createdAt
                            ).toLocaleString()}
                          </small>
                        </div>

                        {!notification.isRead && (
                          <button
                            type="button"
                            className="text-button"
                            onClick={() =>
                              markRead(notification.id)
                            }
                          >
                            Mark read
                          </button>
                        )}
                      </article>
                    ))
                )}
              </div>

              {notifications.length > 20 && (
                <div className="notification-dropdown-footer">
                  Showing latest 20 notifications
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="notification-summary">
        <div>
          <strong>{notifications.length}</strong>
          <span>Total notifications</span>
        </div>

        <div>
          <strong>{unreadCount}</strong>
          <span>Unread</span>
        </div>
      </div>

      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="empty-state">
            No notifications.
          </div>
        ) : (
          notifications.map((notification) => (
            <article
              className={`notification ${
                notification.isRead ? "" : "unread"
              }`}
              key={notification.id}
            >
              <div>
                <p>{notification.message}</p>

                {notification.task && (
                  <small>
                    Task: {notification.task.title}
                  </small>
                )}

                <small>
                  {new Date(
                    notification.createdAt
                  ).toLocaleString()}
                </small>
              </div>

              {!notification.isRead && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    markRead(notification.id)
                  }
                >
                  Mark read
                </button>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export default Notifications;