"use client";

import { AdminButton } from "./AdminButton";
import { AdminModal } from "./AdminModal";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Onayla",
  cancelLabel = "Vazgeç",
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AdminModal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <AdminButton type="button" variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </AdminButton>
          <AdminButton type="button" variant={danger ? "danger" : "primary"} onClick={onConfirm}>
            {confirmLabel}
          </AdminButton>
        </>
      }
    >
      <p className="text-sm text-slate-600">{description}</p>
    </AdminModal>
  );
}
