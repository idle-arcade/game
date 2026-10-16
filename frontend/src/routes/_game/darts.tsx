import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/_game/darts")({
  component: DartsRoom,
});

// Placeholder; the Darts room itself is built in US02.
function DartsRoom() {
  const { t } = useTranslation();
  return <h1 className="text-xl font-semibold">{t("rooms.darts")}</h1>;
}
