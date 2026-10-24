import { describe, expect, it } from "vitest";
import { mapAfternicDomain } from "@/lib/afternic/mappers";

describe("mapAfternicDomain", () => {
  it("converts microunit prices and maps status", () => {
    const payload = mapAfternicDomain({
      name: "Example.COM",
      listStatus: "ACTIVE",
      fastTransferStatus: "AWAITING_OPT_IN",
      buynowPrice: 500_000_000,
      floorPrice: null,
      minbidPrice: 100_000_000,
      landingPage: "SALES_TYPE",
      intakeStyle: "CUSTOM_LANDER",
      hidden: false,
      featured: true,
      leasingEnabled: true,
      maxLeasePeriod: 36,
      showLanderBuynowOption: true,
      showLanderMakeOfferOption: true,
      showLanderLeaseToOwnOption: false,
      intakeViews: 12,
      intakeLeads: 3,
      registrar: "GODADDY",
    });

    expect(payload).toMatchObject({
      domain_name: "example.com",
      list_status: "ACTIVE",
      fast_transfer_status: "AWAITING_OPT_IN",
      buynow_price: 500,
      floor_price: null,
      minbid_price: 100,
      landing_page: "SALES_TYPE",
      intake_style: "CUSTOM_LANDER",
      leasing_enabled: true,
      max_lease_period: 36,
      show_lander_buynow: true,
      show_lander_makeoffer: true,
      show_lander_lease: false,
      intake_views: 12,
      intake_leads: 3,
      afternic_registrar: "GODADDY",
    });
  });

  it("applies safe defaults for missing lander fields", () => {
    const payload = mapAfternicDomain({
      name: "example.com",
      listStatus: "PENDING",
    });

    expect(payload.landing_page).toBe("SALES_TYPE");
    expect(payload.intake_style).toBe("BUYNOW");
    expect(payload.show_lander_buynow).toBe(true);
    expect(payload.show_lander_makeoffer).toBe(false);
    expect(payload.show_lander_lease).toBe(false);
  });
});
