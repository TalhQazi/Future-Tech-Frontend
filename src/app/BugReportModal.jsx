import React, { useState, useRef } from 'react';
import { Bug, Upload, X, FileText, CheckCircle2 } from 'lucide-react';
import { Modal, Field, Input, Select, Textarea, Button, useToast } from './ui.jsx';
import { useAuth } from './auth.jsx';
import { bugsApi } from '../api/bugs.js';

const MODULES = [
  'General',
  'Dashboard',
  'Customers & Vehicles',
  'Repair Orders',
  'Inspections',
  'Estimates & Approvals',
  'Diagnostics & AutoMind',
  'Parts & Inventory',
  'Invoices & Payments',
  'Memberships',
  'Scheduling',
  'Reports & Analytics',
  'Settings & Admin',
  'Customer Portal'
];

export const BugReportModal = ({ open, onClose, currentSection = 'general', onCreated }) => {
  const { user } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [priority, setPriority] = useState('medium');
  const [module, setModule] = useState(
    MODULES.find(m => m.toLowerCase().includes(currentSection.toLowerCase())) || 'General'
  );
  const [taskId, setTaskId] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastCreated, setLastCreated] = useState(null);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSeverity('medium');
    setPriority('medium');
    setModule('General');
    setTaskId('');
    setFiles([]);
    setLastCreated(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileSelect = async (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    if (files.length + selected.length > 10) {
      toast.error('Maximum 10 files can be attached per bug report.');
      return;
    }

    setUploading(true);
    try {
      const uploaded = await bugsApi.uploadFiles(selected);
      setFiles(prev => [...prev, ...uploaded]);
      toast.success(`${uploaded.length} file(s) uploaded successfully`);
    } catch (err) {
      toast.error(err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeFile = (idx) => {
    setFiles(files.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a title for the bug report');
      return;
    }
    if (!description.trim()) {
      toast.error('Please provide a description of the issue');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        severity,
        priority,
        module,
        taskId: taskId.trim() || undefined,
        reporterName: user?.name || 'FutureTech User',
        reporterEmail: user?.email || '',
        attachments: files
      };

      const bug = await bugsApi.create(payload);
      setLastCreated(bug);
      toast.success(`Defect report sent to Task Manager!`);
      if (onCreated) onCreated(bug);
    } catch (err) {
      toast.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title={lastCreated ? 'Bug Transmitted to Task Manager' : 'Report a Bug'}
      onClose={handleClose}
      size="lg"
      footer={
        lastCreated ? (
          <div className="row" style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button variant="primary" onClick={handleClose}>Done</Button>
          </div>
        ) : (
          <div className="row between" style={{ width: '100%' }}>
            <span className="small muted">
              Posting to: <strong className="mono">Task Manager API</strong>
            </span>
            <div className="row">
              <Button variant="ghost" onClick={handleClose} disabled={submitting}>Cancel</Button>
              <Button variant="primary" loading={submitting} onClick={handleSubmit}>
                <Bug size={16} /> Submit Bug
              </Button>
            </div>
          </div>
        )
      }
    >
      {lastCreated ? (
        <div className="stack" style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ display: 'inline-flex', justifyContent: 'center' }}>
            <CheckCircle2 size={48} color="#15a34a" />
          </div>
          <h3>Defect Logged in Task Manager</h3>
          <p className="muted" style={{ maxWidth: 440, margin: '8px auto' }}>
            Your bug report has been ingested directly into the centralized <strong>Task Manager</strong> platform with origin <strong>FutureTech OS</strong>. The engineering team has been alerted.
          </p>
          <div className="ft-card" style={{ textAlign: 'left', marginTop: 12 }}>
            <strong>{lastCreated.title || title}</strong>
            <div className="row wrap" style={{ marginTop: 8 }}>
              <span className="ft-badge info">Origin: FutureTech OS</span>
              <span className={`ft-badge ${severity === 'critical' ? 'danger' : 'warn'}`}>
                Severity: {severity.toUpperCase()}
              </span>
              <span className="ft-badge">Module: {module}</span>
              {user?.name && <span className="ft-badge">Reporter: {user.name}</span>}
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="stack">
          <Field label="Bug Title *" hint="Brief description of the defect or issue">
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. RO invoice calculation discrepancy on parts discount"
              autoFocus
              required
            />
          </Field>

          <div className="grid-2">
            <Field label="Severity *" hint="Impact on system or business operations">
              <Select
                value={severity}
                onChange={e => setSeverity(e.target.value)}
                options={[
                  { value: 'low', label: 'Low — Cosmetic or minor issue' },
                  { value: 'medium', label: 'Medium — Normal defect with workaround' },
                  { value: 'high', label: 'High — Major feature impaired' },
                  { value: 'critical', label: 'Critical — Blocking / data loss' }
                ]}
              />
            </Field>

            <Field label="Priority *" hint="Urgency of the fix needed">
              <Select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                  { value: 'urgent', label: 'Urgent' }
                ]}
              />
            </Field>
          </div>

          <div className="grid-2">
            <Field label="Module / Subsystem" hint="Feature area where error was noticed">
              <Select
                value={module}
                onChange={e => setModule(e.target.value)}
                options={MODULES.map(m => ({ value: m, label: m }))}
              />
            </Field>

            <Field label="Linked Task / RO ID (Optional)" hint="Parent task or repair order ID">
              <Input
                value={taskId}
                onChange={e => setTaskId(e.target.value)}
                placeholder="Optional Task ID or RO Number"
              />
            </Field>
          </div>

          <Field label="Description & Reproduction Steps *" hint="Expected vs actual behavior, and steps to reproduce">
            <Textarea
              rows={5}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="1. Navigate to...&#10;2. Click on...&#10;3. Observed error...&#10;Expected result..."
              required
            />
          </Field>

          <div className="stack-sm">
            <label className="ft-field">
              <span>Attachments (Screenshots, Screen Recordings, Logs — up to 10 files)</span>
            </label>
            <div className="row wrap">
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                multiple
                accept="image/*,video/*,.pdf,.docx,.xlsx,.log,.txt"
                onChange={handleFileSelect}
              />
              <Button
                size="sm"
                variant="ghost"
                disabled={uploading || files.length >= 10}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={14} /> {uploading ? 'Uploading to Task Manager...' : 'Attach Screenshots / Files'}
              </Button>
              <span className="small faint">
                Images, Videos (up to 150MB), Docs
              </span>
            </div>

            {files.length > 0 && (
              <div className="stack-sm" style={{ marginTop: 8 }}>
                {files.map((f, i) => (
                  <div key={i} className="row between ft-card" style={{ padding: '6px 10px' }}>
                    <div className="row">
                      <FileText size={16} color="var(--primary)" />
                      <span className="small truncate" style={{ maxWidth: 300 }}>{f.fileName || f.name}</span>
                      <span className="faint small">({Math.round((f.size || 0) / 1024)} KB)</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeFile(i)}>
                      <X size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      )}
    </Modal>
  );
};
