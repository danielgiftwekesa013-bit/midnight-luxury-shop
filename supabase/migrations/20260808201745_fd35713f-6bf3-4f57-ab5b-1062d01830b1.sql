
DROP FUNCTION IF EXISTS public.points_balance(uuid, text);
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
