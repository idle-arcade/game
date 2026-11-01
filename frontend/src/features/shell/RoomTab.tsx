import { Link, type LinkProps } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LockIcon } from "../../components/icons";
import type { RoomStatus } from "./rooms";

type RoomTabProps = {
  label: string;
  status: RoomStatus;
  to: LinkProps["to"];
};

const tabClasses =
  "flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap focus-visible:outline-2 focus-visible:outline-blue-600";

export function RoomTab({ label, status, to }: RoomTabProps) {
  const { t } = useTranslation();
  const locked = status === "locked";

  return (
    <Link
      to={to}
      title={locked ? t("shell.locked") : undefined}
      className={`${tabClasses} ${locked ? "text-neutral-400 hover:text-neutral-600" : "hover:text-neutral-900"}`}
      activeProps={{ className: `border-neutral-900 ${locked ? "" : "text-neutral-900"}` }}
      inactiveProps={{ className: `border-transparent ${locked ? "" : "text-neutral-700"}` }}
    >
      {locked && <LockIcon />}
      {label}
      {locked && <span className="sr-only">({t("shell.locked")})</span>}
    </Link>
  );
}
