-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "licenseExpiry" TIMESTAMP(3),
ADD COLUMN     "licenseNumber" TEXT;

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "brand" TEXT,
ADD COLUMN     "color" TEXT,
ADD COLUMN     "model" TEXT;
