-- Migration: 004_guru_subscriptions
-- Digital Manager Guru payment integration tables

-- =============================================================================
-- Table: guru_subscriptions
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.guru_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    guru_subscription_id TEXT,
    guru_product_id TEXT,
    plan_id TEXT NOT NULL DEFAULT 'free',
    status TEXT NOT NULL DEFAULT 'inactive'
        CHECK (status IN ('active', 'inactive', 'cancelled', 'expired', 'overdue', 'trial')),
    subscriber_email TEXT,
    subscriber_name TEXT,
    current_cycle INTEGER DEFAULT 0,
    cycle_start_date TIMESTAMPTZ,
    cycle_end_date TIMESTAMPTZ,
    next_cycle_at TIMESTAMPTZ,
    payment_method TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique index on user_id (one subscription per user)
CREATE UNIQUE INDEX IF NOT EXISTS idx_guru_subscriptions_user_id
    ON public.guru_subscriptions (user_id);

-- Index on guru_subscription_id for webhook lookups
CREATE INDEX IF NOT EXISTS idx_guru_subscriptions_guru_sub_id
    ON public.guru_subscriptions (guru_subscription_id);

-- Index on status for filtering
CREATE INDEX IF NOT EXISTS idx_guru_subscriptions_status
    ON public.guru_subscriptions (status);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION public.handle_guru_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_guru_subscriptions_updated_at ON public.guru_subscriptions;
CREATE TRIGGER trigger_guru_subscriptions_updated_at
    BEFORE UPDATE ON public.guru_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_guru_subscriptions_updated_at();

-- =============================================================================
-- Table: guru_webhook_logs
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.guru_webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_type TEXT NOT NULL,
    guru_id TEXT NOT NULL,
    status_received TEXT,
    raw_payload JSONB,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index on guru_id for lookups
CREATE INDEX IF NOT EXISTS idx_guru_webhook_logs_guru_id
    ON public.guru_webhook_logs (guru_id);

-- Unique index for idempotency (prevent duplicate webhook processing)
CREATE UNIQUE INDEX IF NOT EXISTS idx_guru_webhook_logs_idempotency
    ON public.guru_webhook_logs (guru_id, status_received);

-- =============================================================================
-- Row Level Security
-- =============================================================================

-- Enable RLS on guru_subscriptions
ALTER TABLE public.guru_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscription
CREATE POLICY "Users can read own subscription"
    ON public.guru_subscriptions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Service role has full access to guru_subscriptions
CREATE POLICY "Service role full access on guru_subscriptions"
    ON public.guru_subscriptions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Enable RLS on guru_webhook_logs
ALTER TABLE public.guru_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Service role can insert webhook logs
CREATE POLICY "Service role can insert webhook logs"
    ON public.guru_webhook_logs
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Service role can read webhook logs
CREATE POLICY "Service role can read webhook logs"
    ON public.guru_webhook_logs
    FOR SELECT
    TO service_role
    USING (true);
