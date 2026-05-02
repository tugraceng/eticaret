"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";

export const AdminTextarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function AdminTextarea({ className = "", ...rest }, ref) {
    return <textarea ref={ref} className={`input-soft ${className}`.trim()} {...rest} />;
  },
);
