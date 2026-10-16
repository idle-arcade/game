import { useTranslation } from "react-i18next";
import { LanguageSelect } from "../../components/LanguageSelect";
import { LogoutButton } from "../auth/LogoutButton";
import { useCurrentUser } from "../auth/useCurrentUser";

export function GameHeader() {
  const { t } = useTranslation();
  const user = useCurrentUser();

  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
      <span className="text-2xl font-bold whitespace-nowrap">{t("app.title")}</span>
      <div className="ml-auto flex items-center gap-3">
        <LanguageSelect compact />
        <span className="max-w-40 truncate font-medium">{user?.username}</span>
        <LogoutButton />
      </div>
    </header>
  );
}
