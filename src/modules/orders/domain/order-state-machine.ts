export const orderStatuses = [
  "PENDING_PAYMENT",
  "PAID",
  "DESIGN_REVIEW",
  "WAITING_CUSTOMER_APPROVAL",
  "APPROVED",
  "IN_PRODUCTION",
  "QUALITY_CONTROL",
  "READY",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

export type OrderStatusValue = (typeof orderStatuses)[number];

const transitions: Record<OrderStatusValue, readonly OrderStatusValue[]> = {
  PENDING_PAYMENT: ["PAID", "CANCELLED"],
  PAID: ["DESIGN_REVIEW", "CANCELLED"],
  DESIGN_REVIEW: ["WAITING_CUSTOMER_APPROVAL", "APPROVED", "CANCELLED"],
  WAITING_CUSTOMER_APPROVAL: ["APPROVED", "DESIGN_REVIEW", "CANCELLED"],
  APPROVED: ["IN_PRODUCTION", "CANCELLED"],
  IN_PRODUCTION: ["QUALITY_CONTROL", "CANCELLED"],
  QUALITY_CONTROL: ["IN_PRODUCTION", "READY"],
  READY: ["SHIPPED", "DELIVERED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function allowedOrderTransitions(status: OrderStatusValue): readonly OrderStatusValue[] {
  return transitions[status];
}

export function assertOrderTransition(from: OrderStatusValue, to: OrderStatusValue): void {
  if (!transitions[from].includes(to)) {
    throw new Error(`Order transition ${from} -> ${to} is not allowed`);
  }
}

export function canManageOrderStatus(role: string): boolean {
  return ["ADMIN", "DESIGNER", "PRODUCTION", "CUSTOMER_SUPPORT"].includes(role);
}
