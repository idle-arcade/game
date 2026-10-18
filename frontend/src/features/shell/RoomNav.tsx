import { useTranslation } from "react-i18next";
import { HighscoresMenu } from "./HighscoresMenu";
import { RoomTab } from "./RoomTab";
import { ROOMS, roomStatus } from "./rooms";

export function RoomNav() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-4 border-b border-neutral-200 px-4">
      <nav aria-label={t("shell.navLabel")} className="min-w-0 flex-1 overflow-x-auto">
        <ul className="flex">
          {ROOMS.map((room) => (
            <li key={room.id}>
              <RoomTab
                label={t(`rooms.${room.id}`)}
                status={roomStatus(room.id)}
                to={"to" in room ? room.to : undefined}
              />
            </li>
          ))}
        </ul>
      </nav>
      <HighscoresMenu />
    </div>
  );
}
