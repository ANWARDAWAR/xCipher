import React from "react";
import Link from "next/link";
import { clsx } from "clsx";

export interface LogoProps {
  /** Visual variant: "brand" (editorial display font Kremlin) or "sans" (clean UI font) */
  variant?: "brand" | "sans";
  /** Additional classes applied to the outer wrapper */
  className?: string;
  /** Additional classes applied directly to the SVG icon */
  iconClassName?: string;
  /** Additional classes applied to the text wrapper */
  textClassName?: string;
  /** Whether to show the text or only the icon */
  showText?: boolean;
  /** Custom accent color for the cross & accent text (default: var(--accent) for brand, #f04552 for sans) */
  accentColor?: string;
  /** If provided, renders the logo as a Next.js Link */
  href?: string;
  /** Accessible label when used as a link */
  ariaLabel?: string;
  /** Optional click handler */
  onClick?: () => void;
}

export function LogoIcon({
  className,
  accentColor,
  variant = "brand",
  style,
}: {
  className?: string;
  accentColor?: string;
  variant?: "brand" | "sans";
  style?: React.CSSProperties;
}) {
  const strokeColor =
    accentColor || (variant === "sans" ? "#f04552" : "var(--accent, #f04552)");

  return (
    <svg
      viewBox="0.85 0.85 24.78 24.78"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={clsx("xsypher-logo-icon", className)}
      style={{
        color: "inherit",
        ...style,
      }}
    >
      <rect x="1" y="1" width="10" height="10" fill="currentColor" />
      <rect x="15" y="1" width="10" height="10" fill="currentColor" opacity="0.35" />
      <rect x="1" y="15" width="10" height="10" fill="currentColor" opacity="0.35" />
      <path
        d="M15.5 15.5 24.5 24.5M24.5 15.5l-9 9"
        stroke={strokeColor}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Logo({
  variant = "brand",
  className,
  iconClassName,
  textClassName,
  showText = true,
  accentColor,
  href,
  ariaLabel,
  onClick,
}: LogoProps) {
  const resolvedAccent =
    accentColor || (variant === "sans" ? "#f04552" : "var(--accent, #f04552)");

  const textContent =
    variant === "brand" ? (
      <span className={clsx("wm inline-flex items-baseline", textClassName)}>
        <span>x</span>
        <span
          className="wm-x font-kremlin font-normal tracking-wide"
          style={accentColor ? { color: accentColor } : undefined}
        >
          Sypher
        </span>
      </span>
    ) : (
      <span
        className={clsx(
          "inline-flex items-baseline font-bold tracking-tight font-[var(--f-ui)]",
          textClassName
        )}
      >
        <span>x</span>
        <span style={{ color: resolvedAccent }}>Sypher</span>
      </span>
    );

  const innerContent = (
    <>
      <LogoIcon
        className={iconClassName}
        accentColor={accentColor}
        variant={variant}
      />
      {showText && textContent}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={clsx("xsypher-logo", className)}
        aria-label={ariaLabel || "xSypher"}
        onClick={onClick}
      >
        {innerContent}
      </Link>
    );
  }

  return (
    <span
      className={clsx("xsypher-logo", className)}
      onClick={onClick}
      {...(ariaLabel ? { "aria-label": ariaLabel } : {})}
    >
      {innerContent}
    </span>
  );
}
