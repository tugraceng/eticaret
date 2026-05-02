import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

type CreateInput = {
  country?: string;
  city?: string | null;
  feeCents: number;
  freeThresholdCents?: number;
  isActive?: boolean;
  sortOrder?: number;
};

@Injectable()
export class ShippingService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.shippingRate.findMany({
      orderBy: [{ country: "asc" }, { city: "asc" }, { sortOrder: "asc" }],
    });
  }

  async quote(params: { country?: string | null; city?: string | null; subtotalCents: number }) {
    const country = (params.country ?? "TR").toUpperCase();
    const city = params.city?.trim() || null;
    const cityMatch = city
      ? await this.prisma.shippingRate.findFirst({
          where: {
            isActive: true,
            country,
            city: { equals: city, mode: "insensitive" },
          },
          orderBy: { sortOrder: "asc" },
        })
      : null;
    const rate =
      cityMatch ??
      (await this.prisma.shippingRate.findFirst({
        where: { isActive: true, country, city: null },
        orderBy: { sortOrder: "asc" },
      }));
    if (!rate) {
      const settings = await this.prisma.siteSettings.findFirst();
      const fee = settings?.shippingFeeCents ?? 0;
      const threshold = settings?.freeShippingThresholdCents ?? 0;
      const shippingCents =
        fee > 0 && (threshold === 0 || params.subtotalCents < threshold) ? fee : 0;
      return {
        feeCents: fee,
        freeThresholdCents: threshold,
        shippingCents,
        matched: "default" as const,
      };
    }
    const shippingCents =
      rate.feeCents > 0 &&
      (rate.freeThresholdCents === 0 || params.subtotalCents < rate.freeThresholdCents)
        ? rate.feeCents
        : 0;
    return {
      feeCents: rate.feeCents,
      freeThresholdCents: rate.freeThresholdCents,
      shippingCents,
      matched: city && rate.city ? ("city" as const) : ("country" as const),
    };
  }

  create(input: CreateInput) {
    return this.prisma.shippingRate.create({
      data: {
        country: (input.country ?? "TR").toUpperCase(),
        city: input.city?.trim() || null,
        feeCents: Math.max(0, Math.floor(input.feeCents)),
        freeThresholdCents: Math.max(0, Math.floor(input.freeThresholdCents ?? 0)),
        isActive: input.isActive ?? true,
        sortOrder: input.sortOrder ?? 0,
      },
    });
  }

  async update(id: string, input: Partial<CreateInput>) {
    await this.ensure(id);
    const data: Record<string, unknown> = {};
    if (input.country !== undefined) data.country = input.country.toUpperCase();
    if (input.city !== undefined) data.city = input.city?.trim() || null;
    if (input.feeCents !== undefined) data.feeCents = Math.max(0, Math.floor(input.feeCents));
    if (input.freeThresholdCents !== undefined)
      data.freeThresholdCents = Math.max(0, Math.floor(input.freeThresholdCents));
    if (input.isActive !== undefined) data.isActive = input.isActive;
    if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;
    return this.prisma.shippingRate.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.ensure(id);
    return this.prisma.shippingRate.delete({ where: { id } });
  }

  private async ensure(id: string) {
    const r = await this.prisma.shippingRate.findUnique({ where: { id } });
    if (!r) throw new NotFoundException();
  }
}
