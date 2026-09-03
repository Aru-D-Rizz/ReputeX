-- ReputeX Database Schema Migration
-- Community Threat Reports & Watchlists

CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address TEXT NOT NULL,
    chain TEXT NOT NULL DEFAULT 'ethereum',
    category TEXT NOT NULL,
    description TEXT,
    reporter_ip TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_address ON public.reports (address);
CREATE INDEX IF NOT EXISTS idx_reports_chain ON public.reports (chain);

CREATE TABLE IF NOT EXISTS public.watchlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id TEXT NOT NULL,
    address TEXT NOT NULL,
    chain TEXT NOT NULL DEFAULT 'ethereum',
    label TEXT,
    last_score INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_watchlists_client ON public.watchlists (client_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_address ON public.watchlists (address);
