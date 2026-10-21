import React, { useState } from 'react';
import { api } from '../../../api/client.js';
import { useAuth } from '../../auth.jsx';
import { Card, Button, Select, Textarea, Async, useAsync, useAction, StatusPill, dt, label } from '../../ui.jsx';

export const MessageThread = ({ messages }) => (
  <div className="stack-sm" style={{ maxHeight: 420, overflowY: 'auto' }}>
    {messages.length === 0 && <p className="muted">No messages yet.</p>}
    {messages.map(m => (
      <div key={m.id} className="ft-card" style={{ padding: 10, background: m.direction === 'internal' ? 'rgba(242,177,76,.07)' : m.direction === 'inbound' ? 'var(--surface-2)' : 'rgba(47,123,255,.08)', marginLeft: m.direction === 'outbound' ? 40 : 0, marginRight: m.direction === 'inbound' ? 40 : 0 }}>
        <div className="row between small"><strong>{m.senderName || 'Customer'}</strong><span className="faint">{label(m.channel)} · {dt(m.timestamp)}</span></div>
        <p style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{m.body}</p>
        {m.deliveryStatus && m.deliveryStatus !== 'not_applicable' && <div style={{ marginTop: 4 }}><StatusPill status={m.deliveryStatus} /></div>}
      </div>
    ))}
  </div>
);

export const Composer = ({ onSend, channels }) => {
  const [body, setBody] = useState('');
  const [channel, setChannel] = useState(channels[0]);
  const [run, busy] = useAction();
  return (
    <div className="stack-sm">
      <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write a message" />
      <div className="row">
        {channels.length > 1 && <Select value={channel} onChange={e => setChannel(e.target.value)} options={channels} style={{ width: 'auto' }} />}
        <Button variant="primary" loading={busy} disabled={!body.trim()} onClick={() => run(async () => { await onSend({ body, channel }); setBody(''); })}>{channel === 'internal_note' ? 'Add note' : 'Send'}</Button>
      </div>
    </div>
  );
};

export const RoMessages = ({ ro }) => {
  const { can } = useAuth();
  const s = useAsync(async () => {
    const convs = (await api.get('/conversations', { customerId: ro.customerId })).conversations.filter(c => c.roId === ro.id);
    return convs[0] ? api.get(`/conversations/${convs[0].id}`) : { messages: [] };
  }, [ro.id]);
  const channels = can('messages:send') ? ['portal', 'sms', 'email', 'internal_note'] : ['internal_note'];
  return (
    <Card title="Conversation">
      <Async state={s}>{data => <MessageThread messages={data.messages} />}</Async>
      <div style={{ marginTop: 12 }}><Composer channels={channels} onSend={async ({ body, channel }) => { await api.post('/messages', { roId: ro.id, body, channel }); s.reload(); }} /></div>
    </Card>
  );
};
