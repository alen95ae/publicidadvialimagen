-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Support" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "widthM" REAL,
    "heightM" REAL,
    "latitude" REAL,
    "longitude" REAL,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "priceMonth" REAL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'DISPONIBLE',
    "areaM2" REAL,
    "pricePerM2" REAL,
    "productionCost" REAL,
    "productionCostOverride" BOOLEAN NOT NULL DEFAULT false,
    "owner" TEXT,
    "companyId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Support_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Support" ("address", "available", "city", "code", "companyId", "country", "createdAt", "heightM", "id", "latitude", "longitude", "priceMonth", "title", "type", "updatedAt", "widthM") SELECT "address", "available", "city", "code", "companyId", "country", "createdAt", "heightM", "id", "latitude", "longitude", "priceMonth", "title", "type", "updatedAt", "widthM" FROM "Support";
DROP TABLE "Support";
ALTER TABLE "new_Support" RENAME TO "Support";
CREATE UNIQUE INDEX "Support_code_key" ON "Support"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
