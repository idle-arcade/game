import { useTranslation } from "react-i18next";
import { ChevronDownIcon } from "../../components/icons";
import { Button } from "../../components/ui/Button";

/** Highscores dropdown trigger. Disabled until highscores exist; the menu itself comes later. */
export function HighscoresMenu() {
  const { t } = useTranslation();

  return (
    <Button
      variant="ghost"
      className="flex items-center gap-1 text-sm"
      aria-haspopup="menu"
      aria-expanded={false}
      title={t("common.comingSoon")}
      disabled
    >
      {t("shell.highscores")}
      <ChevronDownIcon />
    </Button>
  );
}
