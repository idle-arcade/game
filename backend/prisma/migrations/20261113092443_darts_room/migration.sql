-- CreateTable
CREATE TABLE `darts_room` (
    `userId` VARCHAR(191) NOT NULL,
    `levels` JSON NOT NULL,
    `t` BIGINT UNSIGNED NOT NULL,
    `epoch` VARCHAR(64) NOT NULL,
    `lastSeq` INTEGER UNSIGNED NOT NULL,
    `lastResponse` JSON NULL,

    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `darts_room` ADD CONSTRAINT `darts_room_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
