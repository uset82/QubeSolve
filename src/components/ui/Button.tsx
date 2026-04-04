"use client";

import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonBaseProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
  loading?: boolean;
  trailingIcon?: ReactNode;
  variant?: ButtonVariant;
}

type LinkButtonProps = ButtonBaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "className" | "href"> & {
    href: string;
  };

type NativeButtonProps = ButtonBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className"> & {
    href?: never;
  };

export type ButtonProps = LinkButtonProps | NativeButtonProps;

function isLinkButton(props: ButtonProps): props is LinkButtonProps {
  return typeof (props as LinkButtonProps).href === "string";
}

function getClassName({
  className,
  fullWidth,
  loading,
  variant = "primary",
}: Pick<ButtonBaseProps, "className" | "fullWidth" | "loading" | "variant">): string {
  return [
    "button",
    `button--${variant}`,
    fullWidth ? "button--full" : "",
    loading ? "button--loading" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

function ButtonContent({
  children,
  leadingIcon,
  loading,
  trailingIcon,
}: Pick<
  ButtonBaseProps,
  "children" | "leadingIcon" | "loading" | "trailingIcon"
>) {
  return (
    <>
      {loading ? <span className="button__spinner" aria-hidden="true" /> : leadingIcon}
      <span>{children}</span>
      {!loading ? trailingIcon : null}
    </>
  );
}

export default function Button(props: ButtonProps) {
  const className = getClassName(props);
  const disabled = Boolean(props.disabled || props.loading);

  if (isLinkButton(props)) {
    const rest: Partial<LinkButtonProps> = { ...props };
    delete rest.children;
    delete rest.className;
    delete rest.disabled;
    delete rest.fullWidth;
    delete rest.href;
    delete rest.leadingIcon;
    delete rest.loading;
    delete rest.trailingIcon;
    delete rest.variant;

    const { children, href, leadingIcon, loading, trailingIcon } = props;

    return (
      <Link
        href={href}
        className={className}
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
        <ButtonContent
          leadingIcon={leadingIcon}
          loading={loading}
          trailingIcon={trailingIcon}
        >
          {children}
        </ButtonContent>
      </Link>
    );
  }

  const rest: Partial<NativeButtonProps> = { ...props };
  delete rest.children;
  delete rest.className;
  delete rest.fullWidth;
  delete rest.leadingIcon;
  delete rest.loading;
  delete rest.trailingIcon;
  delete rest.variant;
  delete rest.href;

  const { children, leadingIcon, loading, trailingIcon, type = "button" } = props;

  return (
    <button type={type} className={className} disabled={disabled} {...rest}>
      <ButtonContent
        leadingIcon={leadingIcon}
        loading={loading}
        trailingIcon={trailingIcon}
      >
        {children}
      </ButtonContent>
    </button>
  );
}
