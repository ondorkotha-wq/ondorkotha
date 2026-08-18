// Shared types for the Support Ticket feature.
// Mirrors the backend's Prisma enums & AdminTicketService/SupportService
// response shapes 1:1.

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export type TicketPriority = "LOW" | "NORMAL" | "HIGH";

export interface TicketMessageAuthor {
  name?: string | null;
  role?: string | null;
}

export interface TicketMessage {
  id: number;
  body: string;
  isInternalNote: boolean;
  createdAt: string;
  author: TicketMessageAuthor | null;
}

export interface TicketAssignee {
  name?: string | null;
}

export interface TicketCustomer {
  name?: string | null;
  email?: string | null;
}

export interface Ticket {
  id: number;
  subject: string;
  message: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  // Present on the customer-facing list/detail endpoints.
  assignedTo?: TicketAssignee | null;
  // Present on the admin list/detail endpoints.
  user?: TicketCustomer;
}

export interface TicketDetail extends Ticket {
  messages: TicketMessage[];
}

export interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedTickets {
  data: Ticket[];
  meta: Meta;
}

export interface AssignableStaff {
  id: number;
  name?: string | null;
  email?: string | null;
  role: string;
}
