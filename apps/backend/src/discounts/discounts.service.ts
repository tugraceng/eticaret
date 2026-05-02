import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { DiscountKind, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export type DiscountCalc = {
  id: string;
  code: string;
  kind: DiscountKind;
  value: number;
  discountCents: number;
  description?: string | null;
};

@Injectable()
export class DiscountsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.discountCode.findMany({ orderBy: { createdAt: "desc" } });
  }

  async create(data: {
    code: string;
    kind: DiscountKind;
    value: number;
    minSubtotalCents?: number;
    usageLimit?: number;
    startsAt?: string | null;
    expiresAt?: string | null;
    isActive?: boolean;
    description?: string | null;
  }) {
    const code = data.code.trim().toUpperCase();
    if (code.length < 2) throw new BadRequestException("Kod çok kısa");
    this.validateValue(data.kind, data.value);
    try {
      return await this.prisma.discountCode.create({
        data: {
          code,
          kind: data.kind,
          value: data.value,
          minSubtotalCents: data.minSubtotalCents ?? 0,
          usageLimit: data.usageLimit ?? 0,
          startsAt: data.startsAt ? new Date(data.startsAt) : null,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
          isActive: data.isActive ?? true,
          description: data.description ?? null,
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        throw new BadRequestException("Bu kod zaten kullanılıyor");
      }
      throw e;
    }
  }

  async update(
    id: string,
    data: Partial<{
      code: string;
      kind: DiscountKind;
      value: number;
      minSubtotalCents: number;
      usageLimit: number;
      startsAt: string | null;
      expiresAt: string | null;
      isActive: boolean;
      description: string | null;
    }>,
  ) {
    await this.ensure(id);
    if (typeof data.value === "number" && data.kind) {
      this.validateValue(data.kind, data.value);
    }
    return this.prisma.discountCode.update({
      where: { id },
      data: {
        code: data.code ? data.code.trim().toUpperCase() : undefined,
        kind: data.kind,
        value: data.value,
        minSubtotalCents: data.minSubtotalCents,
        usageLimit: data.usageLimit,
        startsAt:
          data.startsAt === undefined
            ? undefined
            : data.startsAt === null
              ? null
              : new Date(data.startsAt),
        expiresAt:
          data.expiresAt === undefined
            ? undefined
            : data.expiresAt === null
              ? null
              : new Date(data.expiresAt),
        isActive: data.isActive,
        description: data.description,
      },
    });
  }

  async remove(id: string) {
    await this.ensure(id);
    return this.prisma.discountCode.delete({ where: { id } });
  }

  async validate(code: string, subtotalCents: number): Promise<DiscountCalc> {
    const clean = code.trim().toUpperCase();
    if (!clean) throw new BadRequestException("Kod girin");
    const d = await this.prisma.discountCode.findUnique({ where: { code: clean } });
    if (!d || !d.isActive) throw new BadRequestException("Geçersiz kod");
    const now = new Date();
    if (d.startsAt && d.startsAt > now) throw new BadRequestException("Kod henüz geçerli değil");
    if (d.expiresAt && d.expiresAt < now) throw new BadRequestException("Kodun süresi dolmuş");
    if (d.usageLimit > 0 && d.usageCount >= d.usageLimit)
      throw new BadRequestException("Kod kullanım limiti doldu");
    if (d.minSubtotalCents > 0 && subtotalCents < d.minSubtotalCents)
      throw new BadRequestException(
        `Bu kod en az ${(d.minSubtotalCents / 100).toLocaleString("tr-TR")} ₺ sepet için geçerli`,
      );

    const discountCents =
      d.kind === "PERCENT"
        ? Math.min(subtotalCents, Math.floor((subtotalCents * d.value) / 100))
        : Math.min(subtotalCents, d.value);

    return {
      id: d.id,
      code: d.code,
      kind: d.kind,
      value: d.value,
      discountCents,
      description: d.description,
    };
  }

  async consume(id: string) {
    await this.prisma.discountCode.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });
  }

  private validateValue(kind: DiscountKind, value: number) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new BadRequestException("Geçerli bir değer girin");
    }
    if (kind === "PERCENT" && (value < 1 || value > 99)) {
      throw new BadRequestException("Yüzdelik değer 1-99 arasında olmalı");
    }
  }

  private async ensure(id: string) {
    const d = await this.prisma.discountCode.findUnique({ where: { id } });
    if (!d) throw new NotFoundException();
  }
}
