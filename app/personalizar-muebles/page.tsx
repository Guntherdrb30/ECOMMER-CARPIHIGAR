import { getConfigurableProducts } from '@/server/actions/ecpd';
import PersonalizerLanding from './components/PersonalizerLanding';

export const metadata = {
  title: 'Personalizar muebles | Carpihogar',
};

export default async function PersonalizarMueblesIndexPage() {
  const products = await getConfigurableProducts();
  return <PersonalizerLanding products={products} />;
}

