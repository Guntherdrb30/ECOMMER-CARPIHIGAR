"use client";

import { useFormStatus } from "react-dom";

type Props = {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  disabled?: boolean;
  title?: string;
};

export default function PendingButton({ children, pendingText = "Guardando…", className = "", disabled, title }: Props) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending || disabled} title={title}>
      {pending ? pendingText : children}
    </button>
  );
}

