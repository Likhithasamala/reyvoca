import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/** Site-wide content width: 1280px max with responsive side padding. */
export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-[1280px] px-5 sm:px-8 lg:px-12 xl:px-16", className)} {...props} />;
}
