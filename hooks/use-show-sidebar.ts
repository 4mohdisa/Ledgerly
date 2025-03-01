"use client";

import { usePathname } from "next/navigation";

const SIDEBAR_PATHS = ["/", "/transactions", "/recurring-transactions", "/dashboard"];

export const useShowSidebar = () => {
  const pathname = usePathname();
  return pathname ? SIDEBAR_PATHS.includes(pathname) : false;
};
