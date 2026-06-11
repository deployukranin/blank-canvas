import { forwardRef, type HTMLAttributes, type ElementType } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared layout primitives used across the landing page and /auth.
 * They encode the project's section rhythm, container widths and grid tokens
 * so every page stays aligned to the same spacing/grid system.
 */

type SectionProps = HTMLAttributes<HTMLElement> & {
  /** Rendered element. Defaults to <section>. */
  as?: ElementType;
  /** Vertical padding utilities. Defaults to the landing rhythm `py-24`. */
  py?: string;
};

export const Section = forwardRef<HTMLElement, SectionProps>(
  ({ as: Tag = "section", py = "py-24", className, ...props }, ref) => (
    <Tag
      ref={ref}
      className={cn("relative z-10 px-6 scroll-mt-20", py, className)}
      {...props}
    />
  ),
);
Section.displayName = "Section";

const containerWidths = {
  form: "max-w-md",
  prose: "max-w-xl",
  sm: "max-w-3xl",
  md: "max-w-4xl",
  lg: "max-w-5xl",
  xl: "max-w-6xl",
} as const;

type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  width?: keyof typeof containerWidths;
};

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ width = "xl", className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("mx-auto w-full", containerWidths[width], className)}
      {...props}
    />
  ),
);
Container.displayName = "Container";

const gridCols = {
  "1": "grid-cols-1",
  "2": "grid-cols-1 md:grid-cols-2",
  "3": "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  "3-md": "grid-cols-1 md:grid-cols-3",
  "4": "grid-cols-2 md:grid-cols-4",
} as const;

const gridGaps = {
  3: "gap-3",
  4: "gap-4",
  5: "gap-5",
  6: "gap-6",
  8: "gap-8",
  10: "gap-10",
} as const;

type GridProps = HTMLAttributes<HTMLDivElement> & {
  cols?: keyof typeof gridCols;
  gap?: keyof typeof gridGaps;
};

export const Grid = forwardRef<HTMLDivElement, GridProps>(
  ({ cols = "1", gap = 6, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("grid", gridCols[cols], gridGaps[gap], className)}
      {...props}
    />
  ),
);
Grid.displayName = "Grid";
