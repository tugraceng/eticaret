import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { GuestAbandonDto } from "./guest-abandon.dto";

describe("GuestAbandonDto", () => {
  it("kabul eder: e-posta, izin ve en az bir satır", async () => {
    const dto = plainToInstance(GuestAbandonDto, {
      email: "musteri@ornek.com",
      marketingOptIn: true,
      lines: [
        {
          productId: "prod_1",
          quantity: 2,
          title: "Ürün",
          priceCents: 1999,
          slug: "urun-slug",
        },
      ],
    });
    const errs = await validate(dto);
    expect(errs).toHaveLength(0);
  });

  it("reddeder: boş satırlar", async () => {
    const dto = plainToInstance(GuestAbandonDto, {
      email: "a@b.co",
      marketingOptIn: false,
      lines: [],
    });
    const errs = await validate(dto);
    expect(errs.length).toBeGreaterThan(0);
  });
});
