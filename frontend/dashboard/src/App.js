import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    fetchPayments();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get('/api/v1/orders', {
        headers: { 'X-Api-Key': 'keytestabc123', 'X-Api-Secret': 'secrettestxyz789' }
      });
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Orders error:', err);
      setOrders([]);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await axios.get('/api/v1/payments', {
        headers: { 'X-Api-Key': 'keytestabc123', 'X-Api-Secret': 'secrettestxyz789' }
      });
      setPayments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Payments error:', err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const totalTransactions = orders.length;
  const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0) / 100;
  const successRate = payments.length ? ((payments.filter(p => p.status === 'success').length / payments.length) * 100).toFixed(1) : 0;

  if (loading) return <div data-test-id="loading">Loading...</div>;

  return (
    <div data-test-id="dashboard-container" className="App">
      {/* LOGIN FORM */}
      <div data-test-id="login-form" style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
        <h3>Merchant Login</h3>
        <input data-test-id="email-input" type="email" defaultValue="test@example.com" readOnly style={{ marginRight: '10px' }} />
        <span data-test-id="api-key">keytestabc123</span> | 
        <span data-test-id="api-secret">secrettestxyz789</span>
      </div>

      {/* STATS */}
      <div data-test-id="stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <div><strong data-test-id="total-transactions">{totalTransactions}</strong> Transactions</div>
        <div><strong data-test-id="total-amount">₹{totalAmount.toFixed(2)}</strong> Total Amount</div>
        <div><strong data-test-id="success-rate">{successRate}%</strong> Success Rate</div>
      </div>

      <section>
        <h2 data-test-id="orders-title">Orders</h2>
        <table data-test-id="orders-table">
          <thead>
            <tr><th>ID</th><th>Amount</th><th>Status</th><th>Created</th></tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id} data-test-id={`order-row-${order.id.substring(0,8)}`}>
                <td>{order.id}</td>
                <td>₹{order.amount / 100}</td>
                <td>{order.status}</td>
                <td>{new Date(order.createdat).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 data-test-id="payments-title">Payments</h2>
        <table data-test-id="payments-table">
          <thead>
            <tr><th>ID</th><th>Method</th><th>Status</th><th>VPA/Last4</th></tr>
          </thead>
          <tbody>
            {payments.map(pay => (
              <tr key={pay.id} data-test-id={`payment-row-${pay.id.substring(0,8)}`}>
                <td>{pay.id}</td>
                <td>{pay.method?.toUpperCase()}</td>
                <td>{pay.status}</td>
                <td>{pay.vpa || pay.cardlast4 || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default App;
