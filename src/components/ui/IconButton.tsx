"use client";

import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

interface IconButtonBaseProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  label: string;
}

type IconButtonLinkProps = IconButtonBaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "className" | "href"> & {
    href: string;
  };

type IconButtonNativeProps = IconButtonBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className"> & {
    href?: never;
  };

type IconButtonProps = IconButtonLinkProps | IconButtonNativeProps;

function getClassName(className?: string): string {
  return ["ui-icon-button", className ?? ""].filter(Boolean).join(" ");
}

function isLinkIconButton(props: IconButtonProps): props is IconButtonLinkProps {
  return typeof (props as IconButtonLinkProps).href === "string";
}

export default function IconButton(props: IconButtonProps) {
  const className = getClassName(props.className);
  const disabled = Boolean(props.disabled);

  if (isLinkIconButton(props)) {
    const rest: Partial<IconButtonLinkProps> = { ...props };
    delete rest.children;
    delete rest.className;
    delete rest.disabled;
    delete rest.href;
    delete rest.label;

    const { children, href, label } = props;

    return (
      <Link
        href={href}
        className={className}
        aria-label={label}
        aria-disabled={disabled}
        onClick={(event) => {
          if (disabled) {
            event.preventDefault();
            return;
          }

          props.onClick?.(event);
        }}
        tabIndex={disabled ? -1 : props.tabIndex}
        {...rest}
      >
        {children}
      </Link>
    );
  }

  const rest: Partial<IconButtonNativeProps> = { ...props };
  delete rest.children;
  delete rest.className;
  delete rest.disabled;
  delete rest.href;
  delete rest.label;

  const { children, label, type = "button" } = props;

  return (
    <button
      type={type}
      className={className}
      aria-label={label}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
