import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/Button";
import { useLogout } from "./useLogout";

export function LogoutButton() {
  const { t } = useTranslation();
  const { logout, pending } = useLogout();

  return (
    <Button variant="secondary" disabled={pending} onClick={logout}>
      {t("auth.logout")}
    </Button>
  );
}
