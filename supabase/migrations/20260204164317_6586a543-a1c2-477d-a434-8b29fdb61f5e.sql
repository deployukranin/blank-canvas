-- 1. Garante que a segurança RLS está ativa
ALTER TABLE custom_orders ENABLE ROW LEVEL SECURITY;

-- 2. Limpeza: Remove políticas permissivas antigas para evitar conflitos
DROP POLICY IF EXISTS "Anyone can insert orders" ON custom_orders;
DROP POLICY IF EXISTS "Public read access" ON custom_orders;
DROP POLICY IF EXISTS "Enable read access for all users" ON custom_orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON custom_orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON custom_orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON custom_orders;

-- 3. Política de Leitura: Usuário só vê o pedido se o user_id for dele
CREATE POLICY "Users can view their own orders"
ON custom_orders
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. Política de Inserção: Usuário só cria se assinar com seu ID
CREATE POLICY "Users can insert their own orders"
ON custom_orders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 5. Política de Atualização: Usuário só mexe no que é dele
CREATE POLICY "Users can update their own orders"
ON custom_orders
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 6. Bloqueio final para usuários não logados
REVOKE ALL ON custom_orders FROM anon;