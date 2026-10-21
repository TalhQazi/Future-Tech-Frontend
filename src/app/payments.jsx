import React, { useEffect, useRef, useState } from 'react';
import { api, newIdempotencyKey } from '../api/client.js';
import { Button, Alert, Spinner, useToast, money } from './ui.jsx';

let stripeScript = null;
const loadStripe = () => {
  if (window.Stripe) return Promise.resolve(window.Stripe);
  if (!stripeScript) {
    stripeScript = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://js.stripe.com/v3/';
      s.onload = () => resolve(window.Stripe);
      s.onerror = () => { stripeScript = null; reject(new Error('Could not load the payment form')); };
      document.head.appendChild(s);
    });
  }
  return stripeScript;
};

// Card payment through Stripe Elements; card data never touches this app's servers.
export const OnlinePayment = ({ invoice, onPaid }) => {
  const [providers, setProviders] = useState(null);
  const [intent, setIntent] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const mountRef = useRef(null);
  const stripeRef = useRef(null);
  const toast = useToast();
  useEffect(() => { api.get('/payments/providers').then(r => setProviders(r.providers)).catch(setError); }, []);

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await api.post(`/invoices/${invoice.id}/online-payment`, {}, { idempotencyKey: newIdempotencyKey() });
      const Stripe = await loadStripe();
      stripeRef.current = { stripe: Stripe(res.publishableKey) };
      const elements = stripeRef.current.stripe.elements({ clientSecret: res.clientSecret, appearance: { theme: 'night' } });
      stripeRef.current.elements = elements;
      setIntent(res);
      setTimeout(() => elements.create('payment').mount(mountRef.current), 0);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };
  const pay = async () => {
    setBusy(true);
    const { error: stripeError } = await stripeRef.current.stripe.confirmPayment({ elements: stripeRef.current.elements, redirect: 'if_required' });
    if (stripeError) {
      setError(stripeError);
      setBusy(false);
      return;
    }
    const synced = await api.post(`/payments/${intent.paymentId}/sync`).catch(() => null);
    setBusy(false);
    if (synced?.payment?.status === 'succeeded') {
      toast.success('Payment received');
      onPaid?.();
    } else {
      toast.info('Payment is processing; the balance updates when the bank confirms it');
      onPaid?.();
    }
  };

  if (!providers) return <Spinner />;
  if (!providers.stripe.configured || !providers.stripe.publishableKey) {
    return <Alert tone="info">Online card payment is not available for this shop. Pay in person at the service desk.</Alert>;
  }
  return (
    <div className="stack">
      {error && <Alert tone="danger">{error.message}</Alert>}
      {!intent ? <Button variant="primary" loading={busy} onClick={start}>Pay {money(invoice.balanceCents, invoice.currency)} by card</Button> : (
        <>
          <div ref={mountRef} style={{ background: '#0a1120', padding: 12, borderRadius: 8 }} />
          <Button variant="primary" loading={busy} onClick={pay}>Pay {money(invoice.balanceCents, invoice.currency)}</Button>
        </>
      )}
    </div>
  );
};
