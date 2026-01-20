-- Adicionar campo openpix_receiver_id na tabela influencers
-- Este campo armazena o ID do recebedor configurado diretamente na OpenPix

ALTER TABLE public.influencers
ADD COLUMN IF NOT EXISTS openpix_receiver_id TEXT DEFAULT NULL;

-- Comentário explicativo
COMMENT ON COLUMN public.influencers.openpix_receiver_id IS 'ID do recebedor cadastrado na OpenPix para split automático';

-- Remover campos antigos que não são mais necessários (pix_key, pix_key_type, tax_id)
-- Manter por enquanto para não perder dados existentes, mas eles não serão usados no novo fluxo