-- CreateTable
CREATE TABLE "config" (
    "id" SERIAL NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entries" (
    "id" SERIAL NOT NULL,
    "checkpoint_id" TEXT,
    "pillar" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "metric_key" TEXT NOT NULL,
    "value_numeric" DECIMAL(65,30),
    "value_text" TEXT,
    "value_boolean" BOOLEAN,
    "proof_url" TEXT,
    "proof_type" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "logged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entry_date" DATE NOT NULL,

    CONSTRAINT "entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "self_checks" (
    "id" SERIAL NOT NULL,
    "week_date" DATE NOT NULL,
    "energy" INTEGER,
    "sleep_quality" INTEGER,
    "relationship_quality" INTEGER,
    "work_satisfaction" INTEGER,
    "notes" TEXT,
    "logged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "self_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habit_logs" (
    "id" SERIAL NOT NULL,
    "habit_key" TEXT NOT NULL,
    "log_date" DATE NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,

    CONSTRAINT "habit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "habit_logs_habit_key_log_date_key" ON "habit_logs"("habit_key", "log_date");
