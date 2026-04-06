-- Allow creators to delete their own tickets
CREATE POLICY "Creators can delete own tickets"
ON public.support_tickets
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Allow creators to delete messages from their own tickets
CREATE POLICY "Creators can delete own ticket messages"
ON public.support_messages
FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM support_tickets t
  WHERE t.id = support_messages.ticket_id
  AND t.user_id = auth.uid()
));

-- Super admins can delete any ticket
CREATE POLICY "Super admins can delete tickets"
ON public.support_tickets
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Super admins can delete any message
CREATE POLICY "Super admins can delete messages"
ON public.support_messages
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));