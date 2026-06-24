-- Drop level display column from user progress; score is tracked via totalScore only.
ALTER TABLE `UserProgress` DROP COLUMN `currentLevel`;
