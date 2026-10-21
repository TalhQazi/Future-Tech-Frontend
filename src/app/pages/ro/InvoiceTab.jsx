import React from 'react';
import { FileText } from 'lucide-react';
import { api } from '../../../api/client.js';
import { useAuth } from '../../auth.jsx';
import { Card, Button, Empty, Async, useAsync, useAction, useConfirm } from '../../ui.jsx';
import { InvoiceView } from '../Accounting.jsx';

export const InvoiceTab = ({ ro, reloadRo }) => {
  const { can } = useAuth();
  const confirm = useConfirm();
  const [run, busy] = useAction();
  const s = useAsync(() => api.get(`/repair-orders/${ro.id}/invoice`).then(r => r.invoice), [ro.id]);
  const generate = () => run(async () => { s.setData((await api.action(`/repair-orders/${ro.id}/invoice`)).invoice); }, 'Invoice drafted from approved work');
  return (
    <Async state={s}>{invoice => (invoice ? (
      <>
        {invoice.status === 'draft' && can('invoices:write') && <div className="row"><Button size="sm" loading={busy} onClick={generate}>Refresh from approved work</Button></div>}
        <InvoiceView invoice={invoice} onChanged={(inv) => { s.setData(inv); reloadRo(); }} confirm={confirm} />
      </>
    ) : (
      <Card title="Invoice">
        <Empty title="No invoice yet" hint="Draft the invoice from customer-approved estimate lines." action={can('invoices:write') && <Button variant="primary" loading={busy} onClick={generate}><FileText size={14} />Draft invoice</Button>} />
      </Card>
    ))}</Async>
  );
};
