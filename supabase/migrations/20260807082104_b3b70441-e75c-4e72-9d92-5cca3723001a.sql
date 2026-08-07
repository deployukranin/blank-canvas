DELETE FROM public.custom_orders WHERE store_id = 'd5abc621-9739-4e6b-9e91-5b4aee4c229e' AND correlation_id LIKE 'mock%';
DELETE FROM public.custom_orders WHERE store_id = 'd5abc621-9739-4e6b-9e91-5b4aee4c229e';
DELETE FROM public.vip_subscriptions WHERE store_id = 'd5abc621-9739-4e6b-9e91-5b4aee4c229e';
DELETE FROM public.store_users WHERE store_id = 'd5abc621-9739-4e6b-9e91-5b4aee4c229e';