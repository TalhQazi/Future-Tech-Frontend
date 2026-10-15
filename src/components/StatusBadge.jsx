import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Wrench, 
  FileText, 
  DollarSign, 
  ShieldCheck, 
  Cpu
} from 'lucide-react';

export const StatusBadge = ({ status, type = 'ro' }) => {
  if (type === 'ro') {
    switch (status) {
      case 'checked_in':
        return (
          <span className="badge badge-slate">
            <Clock size={12} /> Checked In
          </span>
        );
      case 'inspection':
        return (
          <span className="badge badge-amber">
            <Wrench size={12} /> In Inspection
          </span>
        );
      case 'estimate_pending':
        return (
          <span className="badge badge-cyan">
            <FileText size={12} /> Estimate Sent
          </span>
        );
      case 'work_authorized':
        return (
          <span className="badge badge-emerald">
            <ShieldCheck size={12} /> Work Authorized
          </span>
        );
      case 'in_progress':
        return (
          <span className="badge badge-amber">
            <Wrench size={12} /> In Progress
          </span>
        );
      case 'ready_for_payment':
        return (
          <span className="badge badge-cyan">
            <DollarSign size={12} /> Ready for Pay
          </span>
        );
      case 'completed':
        return (
          <span className="badge badge-emerald">
            <CheckCircle2 size={12} /> Completed
          </span>
        );
      default:
        return <span className="badge badge-slate">{status}</span>;
    }
  }

  if (type === 'inspection') {
    switch (status) {
      case 'pass':
        return (
          <span className="badge badge-emerald">
            <CheckCircle2 size={12} /> Pass
          </span>
        );
      case 'attention':
        return (
          <span className="badge badge-amber">
            <AlertTriangle size={12} /> Attention
          </span>
        );
      case 'fail':
        return (
          <span className="badge badge-rose">
            <XCircle size={12} /> Failed
          </span>
        );
      default:
        return <span className="badge badge-slate">{status}</span>;
    }
  }

  if (type === 'dtc') {
    switch (status) {
      case 'critical':
        return (
          <span className="badge badge-rose">
            <XCircle size={12} /> Critical Fault
          </span>
        );
      case 'warning':
        return (
          <span className="badge badge-amber">
            <AlertTriangle size={12} /> Warning
          </span>
        );
      case 'advisory':
        return (
          <span className="badge badge-cyan">
            <Cpu size={12} /> Historical / Info
          </span>
        );
      default:
        return <span className="badge badge-slate">{status}</span>;
    }
  }

  return <span className="badge badge-slate">{status}</span>;
};
