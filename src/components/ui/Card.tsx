import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: "article" | "div" | "section";
  children: ReactNode;
  interactive?: boolean;
  tone?: "default" | "subtle";
}

export default function Card({
  as = "section",
  children,
  className,
  interactive = false,
  tone = "default",
  ...rest
}: CardProps) {
  const Component = as;

  return (
    <Component
      className={[
        "ui-card",
        tone === "subtle" ? "ui-card--subtle" : "",
        interactive ? "ui-card--interactive" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </Component>
  );
}
