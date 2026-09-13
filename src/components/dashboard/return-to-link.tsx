"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

type ReturnToLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
  title?: string;
  "aria-label"?: string;
};

export function ReturnToLink({ href, children, ...props }: ReturnToLinkProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const returnTo = currentSearch ? `${pathname}?${currentSearch}` : pathname;
  const separator = href.includes("?") ? "&" : "?";
  const hrefWithReturnTo = `${href}${separator}returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <Link href={hrefWithReturnTo} {...props}>
      {children}
    </Link>
  );
}
