DROP POLICY IF EXISTS "Transactions are publicly viewable" ON public.transactions;
DROP POLICY IF EXISTS "Deposits are publicly viewable" ON public.deposits;

REVOKE ALL ON public.transactions FROM anon, authenticated;
REVOKE ALL ON public.deposits FROM anon, authenticated;

GRANT ALL ON public.transactions TO service_role;
GRANT ALL ON public.deposits TO service_role;