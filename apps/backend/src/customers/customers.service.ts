import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";

type AddressInput = {
  label?: string;
  contactName?: string;
  phone?: string;
  line1: string;
  line2?: string;
  district?: string;
  city: string;
  postalCode?: string;
  isDefault?: boolean;
};

type CartInputLine = {
  productId: string;
  quantity: number;
  productVariantId?: string;
  lineKey?: string;
  title?: string;
  priceCents?: number;
  slug?: string;
  imageUrl?: string;
};

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        surname: true,
        phone: true,
        birthDate: true,
        marketingOptIn: true,
        customer: {
          select: {
            id: true,
            addresses: {
              orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
              select: {
                id: true,
                label: true,
                contactName: true,
                phone: true,
                line1: true,
                line2: true,
                district: true,
                city: true,
                state: true,
                postalCode: true,
                country: true,
                isDefault: true,
              },
            },
          },
        },
      },
    });
    if (!user) throw new NotFoundException();
    return user;
  }

  async updateProfile(
    userId: string,
    data: Partial<{
      name: string;
      surname: string;
      phone: string;
      birthDate: string;
      marketingOptIn: boolean;
    }>,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { customer: true },
    });
    if (!user) throw new NotFoundException();
    let birth: Date | undefined;
    if (data.birthDate) {
      const d = new Date(data.birthDate);
      if (Number.isNaN(d.getTime())) throw new BadRequestException("Geçersiz tarih");
      birth = d;
    }
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        surname: data.surname,
        phone: data.phone,
        birthDate: birth,
        marketingOptIn: data.marketingOptIn,
      },
    });
    if (user.customer) {
      await this.prisma.customer.update({
        where: { id: user.customer.id },
        data: {
          name: data.name ?? user.customer.name,
          surname: data.surname ?? user.customer.surname,
          phone: data.phone ?? user.customer.phone,
        },
      });
    }
    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      surname: updated.surname,
      phone: updated.phone,
      birthDate: updated.birthDate,
      marketingOptIn: updated.marketingOptIn,
    };
  }

  async changePassword(userId: string, current: string, next: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException();
    const ok = await bcrypt.compare(current, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Mevcut şifre yanlış");
    if (next.length < 8) throw new BadRequestException("Yeni şifre en az 8 karakter olmalı");
    const hash = await bcrypt.hash(next, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
    return { ok: true };
  }

  async listAddresses(userId: string) {
    const c = await this.ensureCustomer(userId);
    return this.prisma.address.findMany({
      where: { customerId: c.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  }

  async addAddress(userId: string, data: AddressInput) {
    const c = await this.ensureCustomer(userId);
    const count = await this.prisma.address.count({ where: { customerId: c.id } });
    const shouldBeDefault = Boolean(data.isDefault) || count === 0;
    return this.prisma.$transaction(async (tx) => {
      if (shouldBeDefault) {
        await tx.address.updateMany({
          where: { customerId: c.id, isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.address.create({
        data: {
          customerId: c.id,
          label: data.label || null,
          contactName: data.contactName || null,
          phone: data.phone || null,
          line1: data.line1,
          line2: data.line2 || null,
          district: data.district || null,
          city: data.city,
          postalCode: data.postalCode || "",
          isDefault: shouldBeDefault,
        },
      });
    });
  }

  async updateAddress(userId: string, id: string, data: AddressInput) {
    const c = await this.ensureCustomer(userId);
    const existing = await this.prisma.address.findUnique({ where: { id } });
    if (!existing || existing.customerId !== c.id) throw new NotFoundException();
    return this.prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.address.updateMany({
          where: { customerId: c.id, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }
      return tx.address.update({
        where: { id },
        data: {
          label: data.label ?? null,
          contactName: data.contactName ?? null,
          phone: data.phone ?? null,
          line1: data.line1,
          line2: data.line2 ?? null,
          district: data.district ?? null,
          city: data.city,
          postalCode: data.postalCode ?? "",
          isDefault: data.isDefault ?? existing.isDefault,
        },
      });
    });
  }

  async removeAddress(userId: string, id: string) {
    const c = await this.ensureCustomer(userId);
    const existing = await this.prisma.address.findUnique({ where: { id } });
    if (!existing || existing.customerId !== c.id) throw new NotFoundException();
    return this.prisma.$transaction(async (tx) => {
      await tx.address.delete({ where: { id } });
      if (existing.isDefault) {
        const next = await tx.address.findFirst({
          where: { customerId: c.id },
          orderBy: { createdAt: "desc" },
        });
        if (next) {
          await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
        }
      }
      return { ok: true };
    });
  }

  async setDefaultAddress(userId: string, id: string) {
    const c = await this.ensureCustomer(userId);
    const existing = await this.prisma.address.findUnique({ where: { id } });
    if (!existing || existing.customerId !== c.id) throw new ForbiddenException();
    return this.prisma.$transaction(async (tx) => {
      await tx.address.updateMany({
        where: { customerId: c.id, isDefault: true },
        data: { isDefault: false },
      });
      return tx.address.update({ where: { id }, data: { isDefault: true } });
    });
  }

  async getCart(userId: string) {
    const cart = await this.ensureCart(userId);
    const items = await this.prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: {
        product: {
          select: {
            id: true,
            slug: true,
            name: true,
            priceCents: true,
            images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
          },
        },
        productVariant: { select: { id: true, label: true, priceCents: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return {
      id: cart.id,
      lines: items.map((i) => {
        const priceCents = i.productVariant
          ? (i.productVariant.priceCents ?? i.product.priceCents)
          : i.product.priceCents;
        return {
          lineKey: i.lineKey,
          productId: i.productId,
          productVariantId: i.productVariantId ?? undefined,
          quantity: i.quantity,
          title: i.productVariant
            ? `${i.product.name} — ${i.productVariant.label}`
            : i.product.name,
          priceCents,
          slug: i.product.slug,
          imageUrl: i.product.images?.[0]?.url,
        };
      }),
    };
  }

  async replaceCart(userId: string, lines: CartInputLine[]) {
    const cart = await this.ensureCart(userId);
    const normalized = this.normalizeCartLines(lines);
    await this.prisma.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      if (normalized.length > 0) {
        await tx.cartItem.createMany({
          data: normalized.map((l) => ({
            cartId: cart.id,
            productId: l.productId,
            productVariantId: l.productVariantId,
            lineKey: l.lineKey,
            quantity: l.quantity,
          })),
        });
      }
    });
    return this.getCart(userId);
  }

  async mergeCart(userId: string, lines: CartInputLine[]) {
    const cart = await this.ensureCart(userId);
    const incoming = this.normalizeCartLines(lines);
    if (incoming.length === 0) return this.getCart(userId);

    const existing = await this.prisma.cartItem.findMany({ where: { cartId: cart.id } });
    const mergedMap = new Map<
      string,
      { productId: string; productVariantId: string | null; quantity: number }
    >();
    for (const e of existing) {
      mergedMap.set(e.lineKey, {
        productId: e.productId,
        productVariantId: e.productVariantId,
        quantity: e.quantity,
      });
    }
    for (const line of incoming) {
      const cur = mergedMap.get(line.lineKey);
      if (cur) {
        cur.quantity += line.quantity;
      } else {
        mergedMap.set(line.lineKey, {
          productId: line.productId,
          productVariantId: line.productVariantId,
          quantity: line.quantity,
        });
      }
    }
    const merged = Array.from(mergedMap.entries()).map(([lineKey, v]) => ({
      lineKey,
      productId: v.productId,
      productVariantId: v.productVariantId,
      quantity: Math.max(1, v.quantity),
    }));
    await this.prisma.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cartItem.createMany({
        data: merged.map((l) => ({
          cartId: cart.id,
          productId: l.productId,
          productVariantId: l.productVariantId,
          lineKey: l.lineKey,
          quantity: l.quantity,
        })),
      });
    });
    return this.getCart(userId);
  }

  private normalizeCartLines(lines: CartInputLine[]) {
    const map = new Map<
      string,
      { productId: string; productVariantId: string | null; lineKey: string; quantity: number }
    >();
    for (const line of lines ?? []) {
      const productId = line.productId?.trim();
      const qty = Math.max(1, Number(line.quantity) || 1);
      if (!productId) continue;
      const productVariantId = line.productVariantId?.trim() || null;
      const lineKey = (line.lineKey?.trim() || this.lineKeyFor(productId, productVariantId)).trim();
      const prev = map.get(lineKey);
      if (prev) prev.quantity += qty;
      else {
        map.set(lineKey, { productId, productVariantId, lineKey, quantity: qty });
      }
    }
    return Array.from(map.values()).map((x) => ({ ...x, quantity: Math.max(1, x.quantity) }));
  }

  private lineKeyFor(productId: string, productVariantId: string | null) {
    return productVariantId ? `v:${productVariantId}` : `p:${productId}`;
  }

  private async ensureCart(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) throw new NotFoundException();
    return this.prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  private async ensureCustomer(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { customer: true },
    });
    if (!user) throw new NotFoundException();
    if (user.customer) return user.customer;
    return this.prisma.customer.create({
      data: {
        email: user.email,
        name: user.name,
        surname: user.surname,
        phone: user.phone,
        userId: user.id,
      },
    });
  }
}
