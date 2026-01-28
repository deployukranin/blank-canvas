-- Adicionar coluna para ID da subconta na Woovi/OpenPix
ALTER TABLE public.influencers ADD COLUMN IF NOT EXISTS woovi_subaccount_id text;

-- Criar índice para buscas rápidas por subconta
CREATE INDEX IF NOT EXISTS idx_influencers_woovi_subaccount ON public.influencers(woovi_subaccount_id) WHERE woovi_subaccount_id IS NOT NULL;