-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "seriesId" TEXT;

-- AlterTable
ALTER TABLE "Reminder" ADD COLUMN     "seriesId" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "seriesId" TEXT;
