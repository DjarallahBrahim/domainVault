-- Migration 003: Registrar index
-- Speeds up the registrar breakdown chart query on the dashboard.

CREATE INDEX IF NOT EXISTS idx_domains_registrar ON public.domains(registrar);
