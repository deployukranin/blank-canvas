
CREATE TABLE public.order_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.custom_orders(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_role text NOT NULL DEFAULT 'admin',
  message text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;

-- Admins can view messages for their store orders
CREATE POLICY "Admins can view order messages"
ON public.order_messages FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'ceo'::public.app_role)
  OR EXISTS (
    SELECT 1 FROM public.custom_orders
    WHERE custom_orders.id = order_messages.order_id
    AND custom_orders.user_id = auth.uid()
  )
);

-- Admins and order owners can send messages
CREATE POLICY "Participants can send order messages"
ON public.order_messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'ceo'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.custom_orders
      WHERE custom_orders.id = order_messages.order_id
      AND custom_orders.user_id = auth.uid()
    )
  )
);

-- Allow updating read_at
CREATE POLICY "Participants can update order messages"
ON public.order_messages FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'ceo'::public.app_role)
  OR EXISTS (
    SELECT 1 FROM public.custom_orders
    WHERE custom_orders.id = order_messages.order_id
    AND custom_orders.user_id = auth.uid()
  )
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_messages;
