import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';

const ProdutoAssinatura = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Product not found - show empty state (no products available yet)
  return (
    <MobileLayout title="Produto não encontrado">
      <div className="px-4 py-12 text-center">
        <p className="text-muted-foreground">Este produto não existe ou ainda não está disponível.</p>
        <Button variant="link" onClick={() => navigate('/loja')}>
          Voltar à loja
        </Button>
      </div>
    </MobileLayout>
  );
};

export default ProdutoAssinatura;
