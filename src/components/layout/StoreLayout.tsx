import { Outlet } from 'react-router-dom';
import { StoreProvider } from '@/contexts/StoreContext';

/**
 * Wraps all /:slug/* routes with StoreProvider
 * so every store page has access to store context.
 */
const StoreLayout = () => {
  return (
    <StoreProvider>
      <Outlet />
    </StoreProvider>
  );
};

export default StoreLayout;
