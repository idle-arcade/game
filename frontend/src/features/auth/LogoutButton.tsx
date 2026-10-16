import { useTranslation } from "react-i18next";
import { LogoutIcon } from "../../components/icons";
import { Button } from "../../components/ui/Button";
import { useLogout } from "./useLogout";

/** Icon-only logout action (mockup: exit icon next to the player name). */
export function LogoutButton() {
  const { t } = useTranslation();
  const { logout, pending } = useLogout();

  return (
    <Button
      variant="ghost"
      className="px-2 text-xl"
      aria-label={t("auth.logout")}
      title={t("auth.logout")}
      disabled={pending}
      onClick={logout}
    >
      <LogoutIcon />
    </Button>
  );
}
