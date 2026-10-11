"use client";

import { useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function NavigationScrollReset() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);

  useLayoutEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;

    // Keep intentional section links (catalog, settings tabs) under router control.
    // Initial loads, query filters and same-page interactions do not reset scroll.
    if (window.location.hash) return;

    // A new page must start above the sticky header, not at its first content node.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
