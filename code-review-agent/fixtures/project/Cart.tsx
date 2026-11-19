import { ProductCard } from "./ProductCard";

const notebook = { name: "Notebook", price: 12.5 };

export function Cart() {
  return <ProductCard name={notebook.name} price={notebook.price} />;
}
