import { PriceTag } from "./PriceTag";

export function ProductCard({
  name,
  price,
}: {
  name: string;
  price: number;
}) {
  return (
    <article>
      <h2>{name}</h2>
      <PriceTag cents={price} />
    </article>
  );
}
