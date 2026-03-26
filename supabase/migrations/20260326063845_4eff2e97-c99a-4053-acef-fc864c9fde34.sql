-- Allow users to self-assign the 'client' role during signup
CREATE POLICY "Users can assign own client role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND role = 'client'::app_role
);