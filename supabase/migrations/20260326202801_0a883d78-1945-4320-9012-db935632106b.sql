
-- Allow ticket participants to update messages (for read receipts)
CREATE POLICY "Ticket participants can update messages" ON public.support_messages
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id AND (t.user_id = auth.uid() OR has_role(auth.uid(), 'super_admin'::app_role))
    )
  );
