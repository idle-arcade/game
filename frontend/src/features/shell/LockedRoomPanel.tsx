import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/Button";
import { ROOMS, type LockableRoomId } from "./rooms";

/** Placeholder for a locked room: name and unlock button. Purchasing is not implemented yet. */
export function LockedRoomPanel({ roomId }: { roomId: LockableRoomId }) {
  const { t, i18n } = useTranslation();
  const room = ROOMS.find((r) => r.id === roomId);
  const price = new Intl.NumberFormat(i18n.language).format(
    room && "unlockPrice" in room ? room.unlockPrice : 0,
  );

  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <span className="text-5xl" aria-hidden="true">
        🔒
      </span>
      <h1 className="text-2xl font-semibold">{t(`rooms.${roomId}`)}</h1>
      <p className="text-neutral-600">{t("shell.locked")}</p>
      <Button disabled title={t("lockedRoom.comingSoon")}>
        {t("lockedRoom.unlock", { price })}
      </Button>
    </section>
  );
}
