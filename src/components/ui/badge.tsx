import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const colors: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  RESERVED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  BORROWED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  MAINTENANCE: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
  LOST: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  PICKED_UP: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  CANCELLED: "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100",
  EXPIRED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  admin: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  user: "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100",
};

export function Badge({
  status,
  className,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { status?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        (status && colors[status]) ?? "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100",
        className
      )}
      {...rest}
    />
  );
}
