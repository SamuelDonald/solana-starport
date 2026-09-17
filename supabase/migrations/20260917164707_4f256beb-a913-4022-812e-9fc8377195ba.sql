CREATE TABLE public.deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  transaction_signature text NOT NULL UNIQUE,
  sol_amount numeric NOT NULL,
  destination_wallet text NOT NULL,
  status text NOT NULL DEFAULT 'CONFIRMED',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX deposits_wallet_idx ON public.deposits (wallet_address, created_at DESC);

GRANT SELECT ON public.deposits TO anon;
GRANT SELECT ON public.deposits TO authenticated;
GRANT ALL ON public.deposits TO service_role;

ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deposits are publicly viewable" ON public.deposits FOR SELECT TO anon, authenticated USING (true);