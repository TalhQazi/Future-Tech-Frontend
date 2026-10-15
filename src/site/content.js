// Website copy. Every claim here is drawn from the FutureTech 2.0 product itself
// (README feature list and the Shop OS views) — no invented clients, stats or quotes.
import {
  UserCheck,
  Wrench,
  ShieldAlert,
  Car,
  Cpu,
  ScanLine,
  SquareKanban,
  ClipboardCheck,
  FileSignature,
  Package,
  CreditCard,
  LayoutDashboard,
  Hand,
  Eye,
  Lock,
  Users,
  Database,
  BadgePercent
} from 'lucide-react';

export const NAV_LINKS = [
  { id: 'platform', label: 'Platform' },
  { id: 'workspaces', label: 'Workspaces' },
  { id: 'diagnostics', label: 'Diagnostics' },
  { id: 'workflow', label: 'Workflow' },
  { id: 'membership', label: 'Membership' }
];

export const PROTOCOLS = [
  'OBD-II',
  'CAN · ISO 15765-4',
  'VIN decoding',
  'Freeze-frame data',
  'Live sensor PIDs',
  'Guided component tests'
];

export const PRINCIPLES = [
  {
    title: 'Zero duplicate typing',
    body: 'Find a customer by name, phone, VIN or plate once. The vehicle, odometer and complaint follow the job from intake to invoice.'
  },
  {
    title: 'Only approved work reaches the bay',
    body: 'Owners approve or decline line by line. The technician’s queue shows authorized work only — a rule the system enforces.'
  },
  {
    title: 'Diagnostics inside the job',
    body: 'Trouble codes, freeze frame, live sensor data and guided tests sit on the repair order. No separate diagnostics app.'
  }
];

export const ROLES = [
  {
    id: 'advisor',
    tagline: 'Check-in, the job board, estimates and checkout.',
    label: 'Service Advisor',
    icon: UserCheck,
    title: 'Run the front desk without retyping a thing.',
    summary: 'Check cars in fast, keep every job visible on one board, and turn inspections into itemized estimates the customer can approve from their phone.',
    points: [
      'Fast-track check-in: search by phone or name, or register a new vehicle',
      'Repair order board from Checked In to Completed',
      'Estimate builder with labor, parts, taxes and member discounts',
      'Checkout and payment recorded against the repair order'
    ],
    cta: 'Open the Advisor workspace'
  },
  {
    id: 'technician',
    tagline: 'Inspection, diagnostics and parts — at the car.',
    label: 'Technician Bay',
    icon: Wrench,
    title: 'Built for tablets — and greasy hands.',
    summary: 'Big touch targets, a one-tap digital inspection and FutureTech diagnostics in the same screen, so technicians stay at the car instead of walking to a terminal.',
    points: [
      'Digital inspection: Pass, Attention or Fail with measurements and photos',
      'Live trouble codes, freeze frame and guided component tests',
      'Request parts to the bay without walking to the counter',
      'Work queue shows customer-approved lines only'
    ],
    cta: 'Open the Technician bay'
  },
  {
    id: 'manager',
    tagline: 'Shop KPIs, technician workload and bay dispatch.',
    label: 'Shop Manager',
    icon: ShieldAlert,
    title: 'See the whole floor at a glance.',
    summary: 'Shop KPIs, technician workloads and a live dispatch board in one view — reassign repair orders across bays with a single click.',
    points: [
      'Active jobs, pending checkouts and completed work',
      'Technician roster with workload and efficiency',
      'Bay dispatch board for every open repair order',
      'One-click reassignment to balance throughput'
    ],
    cta: 'Open the Manager view'
  },
  {
    id: 'customer',
    tagline: 'Live status, findings and line-by-line approvals.',
    label: 'Customer Portal',
    icon: Car,
    title: 'Transparency owners can actually see.',
    summary: 'Vehicle owners follow their car from intake to pickup, review the technician’s findings with photo evidence, and approve exactly the work they want.',
    points: [
      '“My Garage” with vehicles and membership benefits',
      'Live status tracker from check-in to ready for pickup',
      'Inspection findings with photo evidence',
      'Line-by-line approvals with instant price recalculation'
    ],
    cta: 'Open the Customer portal'
  }
];

export const CAPABILITIES = [
  {
    id: 'diagnostics',
    icon: Cpu,
    title: 'FutureTech Diagnostics',
    body: 'Live OBD-II trouble codes, freeze-frame snapshots, guided isolation tests and live telemetry — right on the repair order.',
    role: 'technician',
    link: 'Open in the Technician bay',
    layout: 'feature'
  },
  {
    id: 'checkin',
    icon: ScanLine,
    title: 'Fast-track check-in',
    body: 'One search across name, phone, VIN and plate. Register a customer and vehicle in the same step, then open the job.',
    role: 'advisor',
    link: 'Try a check-in',
    layout: 'checkin'
  },
  {
    id: 'inspection',
    icon: ClipboardCheck,
    title: 'Digital vehicle inspection',
    body: 'One tap per item. Findings, measurements and photo evidence sync straight to the customer’s estimate.',
    role: 'technician',
    link: 'Run an inspection',
    layout: 'inspection'
  },
  {
    id: 'approvals',
    icon: FileSignature,
    title: 'Estimates & line approvals',
    body: 'Itemized labor and parts sent to the customer’s phone. They approve or decline each line and the total updates instantly.',
    role: 'customer',
    link: 'Review an estimate',
    layout: 'approvals'
  },
  {
    id: 'board',
    icon: SquareKanban,
    title: 'Repair order board',
    body: 'Every job on one board, from Checked In through Completed, searchable by customer, VIN or plate.',
    role: 'advisor',
    link: 'Open the board',
    layout: 'board'
  },
  {
    id: 'payment',
    icon: CreditCard,
    title: 'Checkout & payment',
    body: 'Close jobs at the counter or let owners pay online. Card numbers are never stored in the database.',
    role: 'customer',
    link: 'See checkout',
    layout: 'payment'
  },
  {
    id: 'parts',
    icon: Package,
    title: 'Bay parts requisition',
    body: 'Technicians request parts to their bay with quantity and urgency, then mark them installed when they arrive.',
    role: 'technician',
    link: 'Request a part',
    layout: 'parts'
  },
  {
    id: 'dispatch',
    icon: LayoutDashboard,
    title: 'Dispatch & shop KPIs',
    body: 'Active jobs, pending checkouts and technician workload in one view, with one-click reassignment across bays.',
    role: 'manager',
    link: 'Open dispatch',
    layout: 'dispatch'
  }
];

export const DIAGNOSTIC_FEATURES = [
  {
    title: 'Live OBD-II trouble codes',
    body: 'Active, pending and historical codes with severity, module and known root causes.'
  },
  {
    title: 'Freeze-frame snapshot',
    body: 'RPM, vehicle speed, coolant temperature, engine load and fuel trim at the moment of the fault.'
  },
  {
    title: 'Guided component tests',
    body: 'Step-by-step isolation such as a coil swap test or spark plug gap inspection, marked pass or fail.'
  },
  {
    title: 'Live sensor telemetry',
    body: 'Battery voltage, coolant temperature, idle RPM and fuel rail pressure, refreshed on demand.'
  }
];

export const STAGES = [
  {
    name: 'Checked In',
    owner: 'Advisor',
    body: 'Customer and VIN found once. Complaint and odometer captured, bay assigned.'
  },
  {
    name: 'In Inspection',
    owner: 'Technician',
    body: 'Pass / Attention / Fail with photo evidence, diagnostics on the same job.'
  },
  {
    name: 'Estimate Pending',
    owner: 'Advisor → Owner',
    body: 'Itemized labor and parts with member discounts, sent to the owner’s phone.'
  },
  {
    name: 'Work Authorized',
    owner: 'Owner → Technician',
    body: 'Approved lines unlock the bay’s work queue. Declined lines never reach it.'
  },
  {
    name: 'Ready for Checkout',
    owner: 'Advisor · Owner',
    body: 'Pay at the counter or online by card, recorded against the repair order.'
  },
  {
    name: 'Completed',
    owner: 'Manager',
    body: 'The job closes and rolls into the shop’s KPIs on the manager dashboard.'
  }
];

export const REASONS = [
  {
    icon: Hand,
    title: 'Made for the shop floor',
    body: 'Large, tablet-friendly touch targets designed for technicians working under shop lights.',
    featured: true
  },
  {
    icon: Eye,
    title: 'Transparent by default',
    body: 'Owners see the same findings and photos the technician recorded.'
  },
  {
    icon: FileSignature,
    title: 'Approvals with a name on them',
    body: 'Each approval is submitted with the customer’s signature name.'
  },
  {
    icon: Lock,
    title: 'No stored card numbers',
    body: 'Payment confirmation without keeping raw card numbers in the database.'
  },
  {
    icon: Users,
    title: 'A workspace for every role',
    body: 'Advisors, technicians, managers and owners each get a focused view of the same repair order.'
  },
  {
    icon: Database,
    title: 'Cloud-ready data',
    body: 'Connect MongoDB Atlas, or run on the built-in persistent data engine.'
  }
];

export const MEMBERSHIP = {
  icon: BadgePercent,
  tier: 'VIP Gold Care',
  perks: ['15% labor discount', 'Free diagnostics'],
  otherTiers: ['Standard Member', 'Fleet Pro Commercial']
};
