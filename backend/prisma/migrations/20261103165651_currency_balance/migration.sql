-- CreateTable
CREATE TABLE `currency_balance` (
    `userId` VARCHAR(191) NOT NULL,
    `currency` ENUM('beers', 'shamrocks', 'fish', 'coins') NOT NULL,
    `digits` BIGINT UNSIGNED NOT NULL,
    `zeros` INTEGER UNSIGNED NOT NULL,

    PRIMARY KEY (`userId`, `currency`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `currency_balance` ADD CONSTRAINT `currency_balance_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
