import { Link, type LinkProps } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LockIcon } from "../../components/icons";
import type { RoomStatus } from "./rooms";

type RoomTabProps = {
  label: string;
  status: RoomStatus;
  /** Route of the room; locked rooms without one are never linked. */
  to?: LinkProps["to"];
};

const tabClasses =
  "flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap";

export function RoomTab({ label, status, to }: RoomTabProps) {
  const { t } = useTranslation();

  if (status === "available" && to) {
    return (
      <Link
        to={to}
        className={`${tabClasses} hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-blue-600`}
        activeProps={{ className: "border-neutral-900 text-neutral-900" }}
        inactiveProps={{ className: "border-transparent text-neutral-700" }}
      >
        {label}
      </Link>
    );
  }

  return (
    <span
      role="link"
      aria-disabled="true"
      title={t("shell.locked")}
      className={`${tabClasses} cursor-not-allowed border-transparent text-neutral-400`}
    >
      <LockIcon />
      {label}
      <span className="sr-only">({t("shell.locked")})</span>
    </span>
  );
}
