"use client";

import { AdminCard, Icon } from "../ui";
import type { NotificationRow } from "../types";

export function NotificationsPanel({
  notifications,
  unreadNotifs,
  markAllNotificationsRead,
  markNotificationRead,
}: {
  notifications: NotificationRow[];
  unreadNotifs: number;
  markAllNotificationsRead: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
}) {
  return (
    <AdminCard
      title="Bildirimler"
      description={`${unreadNotifs} okunmamış`}
      actions={
        <button
          type="button"
          onClick={() => void markAllNotificationsRead()}
          className="btn-ghost !py-2 !px-3 text-xs"
        >
          <Icon.Check /> Tümünü okundu işaretle
        </button>
      }
    >
      {notifications.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">Bildirim yok.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`flex flex-wrap items-start justify-between gap-3 py-4 ${n.read ? "opacity-60" : ""}`}
            >
              <div className="flex gap-3">
                {!n.read && (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sky-500" aria-hidden />
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                  {n.body && <p className="mt-1 text-xs text-slate-600">{n.body}</p>}
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    {n.type} · {new Date(n.createdAt).toLocaleString("tr-TR")}
                  </p>
                </div>
              </div>
              {!n.read && (
                <button
                  type="button"
                  onClick={() => void markNotificationRead(n.id)}
                  className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-50"
                >
                  Okundu
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </AdminCard>
  );
}
