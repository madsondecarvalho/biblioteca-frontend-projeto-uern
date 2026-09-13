import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950",
        className
      )}
      {...rest}
    />
  );
}

export function CardTitle({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-sm font-medium text-zinc-500 dark:text-zinc-400", className)} {...rest} />;
}

export function CardValue({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-1 text-2xl font-bold", className)} {...rest} />;
}
