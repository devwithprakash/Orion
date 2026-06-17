-- CreateTable
CREATE TABLE "sync_states" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "last_sync_at" TIMESTAMP(3),
    "sync_token" TEXT,
    "history_id" TEXT,
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sync_states_tenant_id_idx" ON "sync_states"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "sync_states_tenant_id_service_key" ON "sync_states"("tenant_id", "service");
