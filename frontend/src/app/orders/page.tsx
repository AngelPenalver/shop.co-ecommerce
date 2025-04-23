"use client";

import { useAppSelector } from "../hook";

export default function OrdersPage(): React.JSX.Element {
  const { orders } = useAppSelector((state) => state.orderSlice);

  console.log(orders);
  return (
    <div>
      <h1>Orders</h1>
      <p>List of orders will be displayed here.</p>
    </div>
  );
}
