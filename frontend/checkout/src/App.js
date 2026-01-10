import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('upi');
  const [vpa, setVpa] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [orderId, setOrderId] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [pollInterval, setPollInterval] = useState(null);

  const API_KEY = 'keytestabc123';
  const API_SECRET = 'secrettestxyz789';
  const HEADERS = {
    'X-Api-Key': API_KEY,
    'X-Api-Secret': API_SECRET,
    'Content-Type': 'application/json'
  };

  const clearPoll = () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('orderId');
    if (id) {
      setOrderId(id);
      setStatus(`Order ${id} loaded. Enter payment details.`);
    }
  }, []);

  const createOrder = async () => {
    if (!amount || parseInt(amount) < 1) {
      setStatus('Enter valid amount');
      return;
    }
    setLoading(true);
    clearPoll();
    try {
      const res = await axios.post('/api/v1/orders', {
        amount: parseInt(amount) * 100,
        receipt: `receipt-${Date.now()}`
      }, { headers: HEADERS });
      setOrderId(res.data.id);
      setPaymentId('');
      setStatus('Order created. Proceed to pay.');
    } catch (err) {
      setStatus(`Order failed: ${err.response?.data?.description || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = async () => {
    if (!orderId) {
      setStatus('Create order first');
      return;
    }
    setLoading(true);
    clearPoll();
    try {
      let body;
      if (method === 'upi') {
        if (!vpa) {
          setStatus('Enter VPA');
          return;
        }
        body = { orderid: orderId, method: 'upi', vpa };
      } else {
        const cleanCard = cardNumber.replace(/\D/g, '');
        if (!cardNumber || cleanCard.length < 13) {
          setStatus('Enter valid card');
          return;
        }
        if (!expMonth || !expYear) {
          setStatus('Enter expiry');
          return;
        }
        if (!cvv || cvv.length !== 3) {
          setStatus('Enter valid CVV');
          return;
        }
        body = {
          orderid: orderId,
          method: 'card',
          cardnumber: cleanCard,
          cardexpirymm: expMonth,
          cardexpiryyy: expYear,
          cardcvv: cvv
        };
      }
      const res = await axios.post('/api/v1/payments', body, { headers: HEADERS });
      setPaymentId(res.data.id);
      setStatus('Payment initiated - processing...');
      // Start polling
      const interval = setInterval(async () => {
        if (!paymentId) return;
        try {
          const pollRes = await axios.get(`/api/v1/payments/${paymentId}`, { headers: HEADERS });
          setStatus(`Status: ${pollRes.data.status.toUpperCase()}`);
          if (pollRes.data.status !== 'processing') {
            clearInterval(interval);
            setStatus(`Payment ${pollRes.data.status === 'success' ? 'successful!' : 'failed!'}`);
          }
        } catch (err) {
          clearInterval(interval);
          setStatus('Poll error');
        }
      }, 1500);
      setPollInterval(interval);
    } catch (err) {
      setStatus(`Payment failed: ${err.response?.data?.description || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => () => clearPoll(), []);

  return (
    <div data-test-id="checkout-container" style={{ maxWidth: '500px', margin: '0 auto', padding: '20px', fontFamily: 'Arial' }}>
      <h1 data-test-id="checkout-title" style={{ textAlign: 'center', color: '#333' }}>Payment Checkout</h1>
      {!orderId && (
        <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Amount</label>
          <input
            data-test-id="amount-input"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="500"
            style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          <button
            data-test-id="create-order-btn"
            onClick={createOrder}
            disabled={!amount || loading}
            style={{ width: '100%', padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Loading...' : 'Create Order'}
          </button>
        </div>
      )}
      {orderId && (
        <>
          <p data-test-id="order-summary" style={{ marginTop: '10px', fontSize: '14px' }}>
            <strong>Order ID:</strong> {orderId} | Amount: ₹{amount}
          </p>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Payment Method</label>
            <select
              data-test-id="method-select"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            >
              <option value="upi">UPI</option>
              <option value="card">Card</option>
            </select>
          </div>
          {method === 'upi' ? (
            <div data-test-id="upi-form">
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>VPA</label>
              <input
                data-test-id="vpa-input"
                type="text"
                value={vpa}
                onChange={(e) => setVpa(e.target.value)}
                placeholder="testuser@paytm"
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>
          ) : (
            <div data-test-id="card-form">
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Card Number</label>
              <input
                data-test-id="card-input"
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="4111111111111111"
                maxLength={19}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>MM</label>
                  <input
                    type="text"
                    value={expMonth}
                    onChange={(e) => setExpMonth(e.target.value)}
                    maxLength={2}
                    placeholder="12"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>YY</label>
                  <input
                    type="text"
                    value={expYear}
                    onChange={(e) => setExpYear(e.target.value)}
                    maxLength={2}
                    placeholder="27"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>CVV</label>
                  <input
                    type="text"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                    maxLength={3}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                </div>
              </div>
            </div>
          )}
          <button
            data-test-id="pay-btn"
            onClick={initiatePayment}
            disabled={!orderId || loading}
            style={{
              width: '100%',
              padding: '12px',
              background: orderId ? '#28a745' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: orderId && !loading ? 'pointer' : 'not-allowed'
            }}
          >
            {loading ? 'Processing...' : 'Pay Now'}
          </button>
        </>
      )}
      {status && (
        <div
          data-test-id="status"
          style={{
            marginTop: '20px',
            padding: '12px',
            borderRadius: '4px',
            background: status.includes('successful') ? '#d4edda' : status.includes('failed') ? '#f8d7da' : '#d1ecf1',
            color: status.includes('successful') ? '#155724' : status.includes('failed') ? '#721c24' : '#0c5460',
            border: `1px solid ${status.includes('successful') ? '#c3e6cb' : status.includes('failed') ? '#f5c6cb' : '#bee5eb'}`
          }}
        >
          {status}
        </div>
      )}
    </div>
  );
}

export default App;
