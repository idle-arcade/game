-- CreateTable
CREATE TABLE `room_sync` (
    `userId` VARCHAR(191) NOT NULL,
    `room` ENUM('darts') NOT NULL,
    `t` BIGINT UNSIGNED NOT NULL,
    `epoch` VARCHAR(64) NOT NULL,
    `lastSeq` INTEGER UNSIGNED NOT NULL,

    PRIMARY KEY (`userId`, `room`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `darts_room` (
    `userId` VARCHAR(191) NOT NULL,
    `betterDarts` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `moreDarts` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `lessCooldown` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `biggerTargets` INTEGER UNSIGNED NOT NULL DEFAULT 0,

    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `room_sync` ADD CONSTRAINT `room_sync_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `darts_room` ADD CONSTRAINT `darts_room_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

