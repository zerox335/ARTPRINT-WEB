import {
  designDecisionSchema,
  resolveDesignDecision,
} from "@/src/modules/customization/domain/design-approval";

describe("design approval", () => {
  it("records approval and advances an order waiting for the customer", () => {
    expect(resolveDesignDecision({ approved: true, version: 3, orderStatus: "WAITING_CUSTOMER_APPROVAL" })).toEqual({
      proofStatus: "APPROVED",
      nextOrderStatus: "APPROVED",
      eventName: "design_approved",
      historyNote: "Diseño v3 aprobado",
      shouldTransitionOrder: true,
    });
  });

  it("requires a comment and returns the design to review when changes are requested", () => {
    expect(() => designDecisionSchema.parse({ approved: false })).toThrow("Describe el cambio solicitado");
    const input = designDecisionSchema.parse({ approved: false, comment: "Aumentar el nombre" });
    expect(resolveDesignDecision({ ...input, version: 1, orderStatus: "WAITING_CUSTOMER_APPROVAL" })).toMatchObject({
      proofStatus: "CHANGES_REQUESTED",
      nextOrderStatus: "DESIGN_REVIEW",
      eventName: "design_change_requested",
      historyNote: "Aumentar el nombre",
    });
  });

  it("does not rewind an order that already left the approval state", () => {
    expect(resolveDesignDecision({ approved: true, version: 1, orderStatus: "IN_PRODUCTION" }).shouldTransitionOrder).toBe(false);
  });
});
