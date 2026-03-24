-- Credit missed PaymentPoint deposit 1: ₦100 paid, ₦50 fee, ₦50 net
INSERT INTO public.transactions (user_id, type, amount, status, reference, description, metadata)
VALUES (
  'bc5b1533-e381-4a6b-ab31-f273f17ecfe0',
  'wallet_fund',
  50,
  'success',
  'cf64c8f3b6e1f5589047ceaba98c6cfa9659cbcd',
  'Wallet funded ₦50 (paid ₦100, fee ₦50) - retroactive credit',
  '{"gateway":"paymentpoint","gross_amount":100,"fee":50,"net_amount":50,"retroactive":true}'::jsonb
) ON CONFLICT DO NOTHING;

UPDATE public.wallets SET balance = balance + 50, updated_at = now()
WHERE id = 'bc5b1533-e381-4a6b-ab31-f273f17ecfe0';

-- Credit missed PaymentPoint deposit 2: ₦2000 paid, ₦50 fee, ₦1950 net
INSERT INTO public.transactions (user_id, type, amount, status, reference, description, metadata)
VALUES (
  '54f9c81d-1fb3-4eb6-9a22-a32f1545b3ec',
  'wallet_fund',
  1950,
  'success',
  '8cdbe8d0d0259b76811bce9c85d8b0d73f4ad6c8',
  'Wallet funded ₦1950 (paid ₦2000, fee ₦50) - retroactive credit',
  '{"gateway":"paymentpoint","gross_amount":2000,"fee":50,"net_amount":1950,"retroactive":true}'::jsonb
) ON CONFLICT DO NOTHING;

UPDATE public.wallets SET balance = balance + 1950, updated_at = now()
WHERE id = '54f9c81d-1fb3-4eb6-9a22-a32f1545b3ec';