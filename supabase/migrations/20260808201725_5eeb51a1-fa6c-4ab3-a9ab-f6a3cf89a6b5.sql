
-- PRODUCTS
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  image text,
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category text NOT NULL DEFAULT 'general',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are publicly readable" ON public.products FOR SELECT TO anon, authenticated USING (active);

-- PROFILES (customers)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  premium_status boolean NOT NULL DEFAULT false,
  premium_unlocked_at timestamptz,
  referral_code text NOT NULL UNIQUE DEFAULT upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name',''), COALESCE(NEW.raw_user_meta_data->>'phone',''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ORDERS
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE DEFAULT 'ORD-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  total numeric(12,2) NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'mpesa',
  payment_status text NOT NULL DEFAULT 'initiated',
  payment_reference text,
  order_status text NOT NULL DEFAULT 'pending',
  customer_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  delivery_info text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own orders read" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = customer_id);
CREATE POLICY "Own orders insert" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric(12,2) NOT NULL
);
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own order items read" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.customer_id = auth.uid()));
CREATE POLICY "Own order items insert" ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.customer_id = auth.uid()));

-- POINTS LEDGERS
CREATE TABLE public.loyalty_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('earned','redeemed')),
  amount integer NOT NULL CHECK (amount > 0),
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.loyalty_points TO authenticated;
GRANT ALL ON public.loyalty_points TO service_role;
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own loyalty read" ON public.loyalty_points FOR SELECT TO authenticated USING (auth.uid() = customer_id);

CREATE TABLE public.referral_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('earned','redeemed')),
  amount integer NOT NULL CHECK (amount > 0),
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.referral_points TO authenticated;
GRANT ALL ON public.referral_points TO service_role;
ALTER TABLE public.referral_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own referral points read" ON public.referral_points FOR SELECT TO authenticated USING (auth.uid() = customer_id);

CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_customer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  points_awarded integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own referrals read" ON public.referrals FOR SELECT TO authenticated USING (auth.uid() = referrer_id);

CREATE TABLE public.premium_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  payment_reference text,
  status text NOT NULL DEFAULT 'initiated',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.premium_payments TO authenticated;
GRANT ALL ON public.premium_payments TO service_role;
ALTER TABLE public.premium_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own premium payments read" ON public.premium_payments FOR SELECT TO authenticated USING (auth.uid() = customer_id);
CREATE POLICY "Own premium payments insert" ON public.premium_payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);

-- BALANCE HELPERS
CREATE OR REPLACE FUNCTION public.points_balance(_customer_id uuid, _kind text)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(SUM(CASE WHEN transaction_type = 'earned' THEN amount ELSE -amount END),0)::int
  FROM (
    SELECT transaction_type, amount FROM public.loyalty_points WHERE customer_id = _customer_id AND _kind = 'loyalty'
    UNION ALL
    SELECT transaction_type, amount FROM public.referral_points WHERE customer_id = _customer_id AND _kind = 'referral'
  ) t;
$$;
GRANT EXECUTE ON FUNCTION public.points_balance(uuid, text) TO authenticated;

-- SEED PRODUCTS
INSERT INTO public.products (name, price, image, stock, category) VALUES
  ('Aero Wireless Earbuds', 2500, '/images/p1.jpg', 24, 'Audio'),
  ('Onyx Smart Watch', 6900, '/images/p2.jpg', 15, 'Wearables'),
  ('Halo Bluetooth Speaker', 3800, '/images/p3.jpg', 30, 'Audio'),
  ('Volt 20K Power Bank', 2200, '/images/p4.jpg', 40, 'Power'),
  ('Studio Over-Ear Headphones', 8500, '/images/p5.jpg', 12, 'Audio'),
  ('Nimbus Fast Charger', 1500, '/images/p6.jpg', 50, 'Power');
