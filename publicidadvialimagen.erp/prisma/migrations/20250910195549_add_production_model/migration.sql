-- CreateTable
CREATE TABLE "Production" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "lugarInstalacion" TEXT NOT NULL,
    "equipoTrabajo" TEXT NOT NULL,
    "responsable" TEXT NOT NULL,
    "tiempoEjecucion" TEXT NOT NULL,
    "fechaLimite" DATETIME NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "notas" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Production_codigo_key" ON "Production"("codigo");
