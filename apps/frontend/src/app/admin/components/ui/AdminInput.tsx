"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

export const AdminInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function AdminInput({ className = "", ...rest }, ref) {
    return <input ref={ref} className={`input-soft ${className}`.trim()} {...rest} />;
  },
);
