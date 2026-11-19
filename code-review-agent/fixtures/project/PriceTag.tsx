export function PriceTag({ cents }: { cents: number }) {
  const dollars = (cents / 100).toFixed(2);
  return <span>{"$" + dollars}</span>;
}
