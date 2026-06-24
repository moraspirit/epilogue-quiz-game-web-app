-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `indexNumber` VARCHAR(191) NULL,
    `username` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_indexNumber_key`(`indexNumber`),
    UNIQUE INDEX `User_username_key`(`username`),
    INDEX `User_role_idx`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuizLevel` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `levelOrder` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `QuizLevel_uuid_key`(`uuid`),
    INDEX `QuizLevel_isActive_levelOrder_idx`(`isActive`, `levelOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuizQuestion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `quizLevelId` INTEGER NOT NULL,
    `questionText` TEXT NOT NULL,
    `answerKey` VARCHAR(191) NOT NULL,
    `questionOrder` INTEGER NOT NULL,

    INDEX `QuizQuestion_quizLevelId_fkey`(`quizLevelId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserProgress` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `questionId` INTEGER NOT NULL,
    `passedAt` DATETIME(3) NOT NULL,
    `isCorrect` BOOLEAN NOT NULL DEFAULT false,

    INDEX `UserProgress_questionId_fkey`(`questionId`),
    INDEX `UserProgress_userId_isCorrect_idx`(`userId`, `isCorrect`),
    INDEX `UserProgress_userId_idx`(`userId`),
    UNIQUE INDEX `UserProgress_userId_questionId_key`(`userId`, `questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `QuizQuestion` ADD CONSTRAINT `QuizQuestion_quizLevelId_fkey` FOREIGN KEY (`quizLevelId`) REFERENCES `QuizLevel`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserProgress` ADD CONSTRAINT `UserProgress_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `QuizQuestion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserProgress` ADD CONSTRAINT `UserProgress_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

