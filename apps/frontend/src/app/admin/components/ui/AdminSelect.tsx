"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";

export const AdminSelect = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function AdminSelect({ className = "", ...rest }, ref) {
    return <select ref={ref} className={`input-soft ${className}`.trim()} {...rest} />;
  },
);
