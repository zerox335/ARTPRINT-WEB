import { z } from "zod";
import type { OrderStatusValue } from "@/src/modules/orders/domain/order-state-machine";

export const designDecisionSchema = z.object({
  approved: z.boolean(),
  comment: z.string().trim().max(1000).optional(),
}).refine((value) => value.approved || Boolean(value.comment?.length), {
  message: "Describe el cambio solicitado",
  path: ["comment"],
});

export function resolveDesignDecision(input: {
  approved: boolean;
  comment?: string;
  version: number;
  orderStatus: OrderStatusValue;
}) {
  return {
    proofStatus: input.approved ? "APPROVED" as const : "CHANGES_REQUESTED" as const,
    nextOrderStatus: input.approved ? "APPROVED" as const : "DESIGN_REVIEW" as const,
    eventName: input.approved ? "design_approved" as const : "design_change_requested" as const,
    historyNote: input.approved ? `Diseño v${input.version} aprobado` : input.comment,
    shouldTransitionOrder: input.orderStatus === "WAITING_CUSTOMER_APPROVAL",
  };
}
