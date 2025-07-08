-- CreateTable
CREATE TABLE "vst_plugin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "product" TEXT,
    "version" TEXT,
    "filePath" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "vst_plugin_filePath_key" ON "vst_plugin"("filePath");
