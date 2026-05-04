import { Injectable, NotFoundException } from "@nestjs/common";
import { AppCacheService } from "../common/cache/app-cache.service";
import { PrismaService } from "../prisma/prisma.service";

const KEY_LIST = "shipping:list";
const TTL_MS = 60_000;

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: AppCacheService,
  ) {}

  list() {
    return this.cache.getOrSet(KEY_LIST, TTL_MS, () =>
      this.prisma.shippingRate.findMany({
        orderBy: [{ country: "asc" }, { city: "asc" }, { sortOrder: "asc" }],
      }),
    );
  }

  private invalidate() {
    this.cache.delPrefix("shipping:");
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

  async create(input: CreateInput) {
    const created = await this.prisma.shippingRate.create({
      data: {
        country: (input.country ?? "TR").toUpperCase(),
        city: input.city?.trim() || null,
        feeCents: Math.max(0, Math.floor(input.feeCents)),
        freeThresholdCents: Math.max(0, Math.floor(input.freeThresholdCents ?? 0)),
        isActive: input.isActive ?? true,
        sortOrder: input.sortOrder ?? 0,
      },
    });
    this.invalidate();
    return created;
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
    const updated = await this.prisma.shippingRate.update({ where: { id }, data });
    this.invalidate();
    return updated;
  }

  async remove(id: string) {
    await this.ensure(id);
    const removed = await this.prisma.shippingRate.delete({ where: { id } });
    this.invalidate();
    return removed;
  }

  private async ensure(id: string) {
    const r = await this.prisma.shippingRate.findUnique({ where: { id } });
    if (!r) throw new NotFoundException();
  }
}
