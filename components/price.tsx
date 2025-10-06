
type PriceProps = {
  priceUSD: number;
  priceAllyUSD?: number;
  tasa: number;
  moneda?: 'USD' | 'VES';
  className?: string;
  isAlly?: boolean;
};

export default function Price({ priceUSD, priceAllyUSD, tasa, moneda = 'USD', className, isAlly = false }: PriceProps) {
  const basePrice = isAlly && priceAllyUSD ? priceAllyUSD : priceUSD;

  const finalPrice = moneda === 'VES' ? basePrice * tasa : basePrice;

  const displayPrice =
    moneda === 'VES'
      ? `Bs.S. ${finalPrice.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : `${finalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return <span className={className}>{displayPrice}</span>;
}
