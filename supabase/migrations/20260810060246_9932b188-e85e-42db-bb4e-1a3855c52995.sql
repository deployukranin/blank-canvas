INSERT INTO public.profiles (user_id, display_name)
SELECT DISTINCT su.user_id, split_part(u.email, '@', 1)
FROM public.store_users su
JOIN auth.users u ON u.id = su.user_id
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = su.user_id);