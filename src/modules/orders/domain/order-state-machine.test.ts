import {
  allowedOrderTransitions,
  assertOrderTransition,
  canManageOrderStatus,
} from "@/src/modules/orders/domain/order-state-machine";

describe("order state machine", () => {
  it("allows the normal production path", () => {
    expect(() => assertOrderTransition("PAID", "DESIGN_REVIEW")).not.toThrow();
    expect(() => assertOrderTransition("APPROVED", "IN_PRODUCTION")).not.toThrow();
    expect(allowedOrderTransitions("QUALITY_CONTROL")).toContain("READY");
  });

  it("blocks skipping customer/design workflow", () => {
    expect(() => assertOrderTransition("PENDING_PAYMENT", "IN_PRODUCTION")).toThrow("not allowed");
    expect(() => assertOrderTransition("DELIVERED", "PAID")).toThrow("not allowed");
  });

  it("blocks customers from administrative transitions", () => {
    expect(canManageOrderStatus("CUSTOMER")).toBe(false);
    expect(canManageOrderStatus("ADMIN")).toBe(true);
    expect(canManageOrderStatus("PRODUCTION")).toBe(true);
  });
});
