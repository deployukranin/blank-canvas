-- Allow authenticated users to create their own stores (for signup flow)
CREATE POLICY "Authenticated users can create stores"
ON public.stores
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Allow authenticated users to insert themselves as store_admins for stores they created
CREATE POLICY "Store creators can add themselves as admin"
ON public.store_admins
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM public.stores 
    WHERE stores.id = store_id 
    AND stores.created_by = auth.uid()
  )
);

-- Allow authenticated users to assign themselves the admin role (only if they own a store)
CREATE POLICY "Store creators can assign own admin role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND role = 'admin'
  AND EXISTS (
    SELECT 1 FROM public.stores 
    WHERE stores.created_by = auth.uid()
  )
);