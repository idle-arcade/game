-- AlterTable
ALTER TABLE `currency_balance` ADD COLUMN `magnitude` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    ADD COLUMN `mantissa` BIGINT UNSIGNED NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX `currency_balance_rank_idx` ON `currency_balance`(`currency`, `magnitude` DESC, `mantissa` DESC, `userId`);

-- Backfill ranking keys (same formula as rankKey in src/shared/currency/amount.ts)
UPDATE `currency_balance` SET
    `magnitude` = IF(`digits` = 0, 0, `zeros` + CHAR_LENGTH(`digits`)),
    `mantissa` = IF(`digits` = 0, 0, CAST(RPAD(`digits`, 10, '0') AS UNSIGNED));
