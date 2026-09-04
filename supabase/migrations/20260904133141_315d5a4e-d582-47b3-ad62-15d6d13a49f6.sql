CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mint_address TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  website_url TEXT,
  twitter_url TEXT,
  telegram_url TEXT,
  discord_url TEXT,
  creator_wallet TEXT NOT NULL,
  total_supply NUMERIC NOT NULL DEFAULT 1000000000,
  decimals INT NOT NULL DEFAULT 9,
  status TEXT NOT NULL DEFAULT 'LIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  token_id UUID REFERENCES public.tokens(id) ON DELETE SET NULL,
  transaction_signature TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('TOKEN_LAUNCH','BUY','SELL','PLATFORM_FEE')),
  amount NUMERIC,
  sol_amount NUMERIC,
  status TEXT NOT NULL DEFAULT 'CONFIRMED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tokens_created_at ON public.tokens (created_at DESC);
CREATE INDEX idx_tokens_creator ON public.tokens (creator_wallet);
CREATE INDEX idx_tx_wallet ON public.transactions (wallet_address, created_at DESC);

GRANT SELECT ON public.tokens TO anon, authenticated;
GRANT SELECT ON public.transactions TO anon, authenticated;
GRANT ALL ON public.tokens TO service_role;
GRANT ALL ON public.transactions TO service_role;
GRANT ALL ON public.users TO service_role;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tokens are publicly viewable" ON public.tokens FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Transactions are publicly viewable" ON public.transactions FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_tokens_updated_at BEFORE UPDATE ON public.tokens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();