-- AlterTable
ALTER TABLE `darts_room` ADD COLUMN `betterDarts` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    ADD COLUMN `biggerTargets` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    ADD COLUMN `lessCooldown` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    ADD COLUMN `moreDarts` INTEGER UNSIGNED NOT NULL DEFAULT 0;

-- Keep the levels stored as JSON so far. Sync sessions are not carried over: the next load starts a new one.
UPDATE `darts_room` SET
    `betterDarts` = COALESCE(JSON_VALUE(`levels`, '$.betterDarts'), 0),
    `biggerTargets` = COALESCE(JSON_VALUE(`levels`, '$.biggerTargets'), 0),
    `lessCooldown` = COALESCE(JSON_VALUE(`levels`, '$.lessCooldown'), 0),
    `moreDarts` = COALESCE(JSON_VALUE(`levels`, '$.moreDarts'), 0);

-- AlterTable
ALTER TABLE `darts_room` DROP COLUMN `epoch`,
    DROP COLUMN `lastResponse`,
    DROP COLUMN `lastSeq`,
    DROP COLUMN `levels`,
    DROP COLUMN `t`;

-- CreateTable
CREATE TABLE `room_sync` (
    `userId` VARCHAR(191) NOT NULL,
    `room` ENUM('darts') NOT NULL,
    `t` BIGINT UNSIGNED NOT NULL,
    `epoch` VARCHAR(64) NOT NULL,
    `lastSeq` INTEGER UNSIGNED NOT NULL,

    PRIMARY KEY (`userId`, `room`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `room_sync` ADD CONSTRAINT `room_sync_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
