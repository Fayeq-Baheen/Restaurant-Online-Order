import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { money } from "../data.js";
export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    api
      .getOrders()
      .then((data) => {
        if (live) setOrders(data);
      })
      .catch((e) => {
        if (live) setError(e.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);
  return (
    <section className="page-section">
      <div className="page-heading">
        <span className="eyebrow">ADMINISTRATION</span>
        <h1>Customer orders</h1>
        <p>Orders saved in the restaurant database.</p>
      </div>
      {loading && <div className="api-status">Loading orders…</div>}
      {error && <div className="api-status api-status-error">{error}</div>}
      {!loading && !error && !orders.length && (
        <div className="no-results">
          <h3>No orders yet</h3>
          <p>Submitted preorders will appear here.</p>
        </div>
      )}
      {!!orders.length && (
        <div className="orders-table-wrap">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Items</th>
                <th>Type</th>
                <th>Requested</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <strong>{o.orderNumber}</strong>
                    <small>{new Date(o.createdAt).toLocaleString()}</small>
                  </td>
                  <td>{o.customerName}</td>
                  <td>{o.phone}</td>
                  <td>
                    {o.items.map((i) => `${i.quantity} × ${i.name}`).join(", ")}
                  </td>
                  <td>{o.fulfilment}</td>
                  <td>{String(o.requestedFor).slice(0, 10)}</td>
                  <td>
                    <span className={`order-status status-${o.status}`}>
                      {o.status}
                    </span>
                  </td>
                  <td>
                    <strong>{money(o.totalAFN)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
