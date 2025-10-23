import { getSettings } from "@/server/actions/settings";
import Cart from "./cart";

export default async function CarritoPage() {
  const settings = await getSettings();
  const tasa = Number((settings as any).tasaVES);

  return <Cart tasa={tasa} />;
}
