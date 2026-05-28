-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "repeatInterval" INTEGER,
ADD COLUMN     "repeatUnit" TEXT;

-- AlterTable
ALTER TABLE "Reminder" ADD COLUMN     "repeatInterval" INTEGER,
ADD COLUMN     "repeatUnit" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "repeatInterval" INTEGER,
ADD COLUMN     "repeatUnit" TEXT;
