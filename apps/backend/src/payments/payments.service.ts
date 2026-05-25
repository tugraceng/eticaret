/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-var-requires */
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import type { PaymentProvider, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { OrdersService } from "../orders/orders.service";
import { promisify, type IyzipayClient, type IyzipayCtor } from "./iyzico.types";

const Iyzipay: IyzipayCtor = require("iyzipay");

type IyzicoExtra = {
  /** Override for full callback URL that iyzico will POST to. */
  callbackUrl?: string;
  /** Public URL of the frontend that the user lands on after payment. */
  frontendUrl?: string;
  /** Override for iyzico API base URL (defaults depend on sandbox flag). */
  baseUrl?: string;
  locale?: "tr" | "en";
};

type ProviderConfigView = {
  provider: PaymentProvider;
  enabled: boolean;
  sandbox: boolean;
  apiKey: string | null;
  /** Kayıtlı anahtarın ilk karakterleri (doğru panel kontrolü için). */
  apiKeyPrefix: string | null;
  hasSecret: boolean;
  secretPreview: string | null;
  extra: IyzicoExtra;
  updatedAt: string | null;
};

type PublicProvider = {
  id: PaymentProvider;
  name: string;
  /** Installed and has required credentials. */
  ready: boolean;
  /** Admin has turned it on for live use. */
  enabled: boolean;
  sandbox: boolean;
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
  ) {}

  // ---------- Provider configuration ----------

  private trimKey(value: string | null | undefined): string | null {
    if (value == null) return null;
    const t = value.trim();
    return t.length > 0 ? t : null;
  }

  /** Sandbox/canlı anahtar öneki ile mod uyumsuzluğunu tespit eder. */
  private iyzicoKeyModeHint(apiKey: string, sandbox: boolean): string | null {
    const k = apiKey.toLowerCase();
    const looksSandbox = k.startsWith("sandbox-");
    if (sandbox && !looksSandbox && !k.startsWith("sandbox")) {
      return "Sandbox açık ama API key sandbox anahtarı gibi görünmüyor (sandbox-... ile başlamalı). Canlı panel anahtarı kullanıyor olabilirsiniz.";
    }
    if (!sandbox && looksSandbox) {
      return "Sandbox kapalı ama sandbox API key kullanılıyor; canlı anahtar gerekir (sandbox- ile başlamaz).";
    }
    return null;
  }

  private iyzicoErrorHint(errorCode: string | undefined, sandbox: boolean): string {
    if (errorCode === "1001") {
      return (
        " Sandbox modu açıkken sandbox-merchant.iyzipay.com panelindeki sandbox-... anahtarlarını kullanın; " +
        "merchant.iyzipay.com (canlı) anahtarları çalışmaz. API base URL alanını boş bırakın."
      );
    }
    if (errorCode === "1000") {
      return sandbox
        ? " API anahtarlarını iyzico Sandbox panelinden kopyaladığınızdan emin olun."
        : " Canlı API anahtarlarını kullandığınızdan emin olun.";
    }
    return "";
  }

  /** Sandbox/canlı anahtar çiftini kaydetmeden önce doğrular. */
  private assertIyzicoKeyPair(
    apiKey: string | null,
    secretKey: string | null,
    sandbox: boolean,
  ): void {
    if (!apiKey || !secretKey) return;
    const k = apiKey.toLowerCase();
    const s = secretKey.toLowerCase();
    if (sandbox) {
      if (!k.startsWith("sandbox-")) {
        throw new BadRequestException(
          "Sandbox modu için API Key sandbox- ile başlamalıdır. " +
            "Canlı panel (merchant.iyzipay.com) değil; sandbox-merchant.iyzipay.com → Ayarlar → Firma Ayarları → API Anahtarları bölümündeki değerleri kullanın.",
        );
      }
      if (!s.startsWith("sandbox-")) {
        throw new BadRequestException(
          "Sandbox modu için Secret Key de sandbox- ile başlamalıdır.",
        );
      }
      return;
    }
    if (k.startsWith("sandbox-") || s.startsWith("sandbox-")) {
      throw new BadRequestException(
        "Canlı modda sandbox- ile başlayan anahtarlar kullanılamaz. Sandbox modunu açın veya canlı anahtarları girin.",
      );
    }
  }

  private baseUrlFor(provider: PaymentProvider, sandbox: boolean, extra: IyzicoExtra): string {
    const sandboxUri = "https://sandbox-api.iyzipay.com";
    const liveUri = "https://api.iyzipay.com";
    const custom = extra.baseUrl?.trim();
    if (custom) {
      const lower = custom.toLowerCase().replace(/\/+$/, "");
      const isSandboxHost = lower.includes("sandbox-api.iyzipay.com");
      const isLiveHost = lower.includes("api.iyzipay.com") && !isSandboxHost;
      if (sandbox && isLiveHost) {
        this.logger.warn(
          "iyzico extra.baseUrl canlı adres içeriyor; sandbox modunda sandbox-api URL kullanılıyor.",
        );
        return sandboxUri;
      }
      if (!sandbox && isSandboxHost) {
        this.logger.warn(
          "iyzico extra.baseUrl sandbox adres içeriyor; canlı modda api.iyzipay.com kullanılıyor.",
        );
        return liveUri;
      }
      return custom.replace(/\/+$/, "");
    }
    if (provider === "IYZICO") {
      return sandbox ? sandboxUri : liveUri;
    }
    return "";
  }

  private toView(row: {
    provider: PaymentProvider;
    enabled: boolean;
    sandbox: boolean;
    apiKey: string | null;
    secretKey: string | null;
    extra: Prisma.JsonValue;
    updatedAt: Date;
  }): ProviderConfigView {
    const extra = (row.extra ?? {}) as IyzicoExtra;
    const hasSecret = !!row.secretKey;
    return {
      provider: row.provider,
      enabled: row.enabled,
      sandbox: row.sandbox,
      apiKey: row.apiKey ?? null,
      apiKeyPrefix: row.apiKey ? `${row.apiKey.slice(0, 12)}…` : null,
      hasSecret,
      secretPreview: hasSecret ? `•••• ${row.secretKey!.slice(-4)}` : null,
      extra,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async getProviderConfig(provider: PaymentProvider): Promise<ProviderConfigView> {
    let row = await this.prisma.paymentProviderConfig.findUnique({ where: { provider } });
    if (!row) {
      row = await this.prisma.paymentProviderConfig.create({ data: { provider } });
    }
    return this.toView(row);
  }

  async upsertProviderConfig(
    provider: PaymentProvider,
    input: {
      enabled?: boolean;
      sandbox?: boolean;
      apiKey?: string | null;
      secretKey?: string | null;
      extra?: Partial<IyzicoExtra> | null;
    },
  ): Promise<ProviderConfigView> {
    const existing =
      (await this.prisma.paymentProviderConfig.findUnique({ where: { provider } })) ??
      (await this.prisma.paymentProviderConfig.create({ data: { provider } }));

    const nextExtra: IyzicoExtra = {
      ...((existing.extra ?? {}) as IyzicoExtra),
      ...(input.extra ?? {}),
    };

    const nextApiKey =
      input.apiKey === undefined
        ? existing.apiKey
        : input.apiKey === ""
          ? null
          : this.trimKey(input.apiKey);
    const nextSecretKey =
      input.secretKey === undefined
        ? existing.secretKey
        : input.secretKey === ""
          ? null
          : this.trimKey(input.secretKey);
    const nextSandbox = input.sandbox ?? existing.sandbox;

    if (provider === "IYZICO") {
      this.assertIyzicoKeyPair(nextApiKey, nextSecretKey, nextSandbox);
    }

    const row = await this.prisma.paymentProviderConfig.update({
      where: { provider },
      data: {
        enabled: input.enabled ?? existing.enabled,
        sandbox: nextSandbox,
        apiKey: nextApiKey,
        secretKey: nextSecretKey,
        extra: nextExtra as Prisma.InputJsonValue,
      },
    });
    return this.toView(row);
  }

  async listProvidersPublic(): Promise<PublicProvider[]> {
    const rows = await this.prisma.paymentProviderConfig.findMany();
    const byId = new Map(rows.map((r) => [r.provider, r] as const));
    const read = (id: PaymentProvider, name: string, requiresCreds: boolean): PublicProvider => {
      const r = byId.get(id);
      const ready = r ? (!requiresCreds || (!!r.apiKey && !!r.secretKey)) : !requiresCreds;
      return {
        id,
        name,
        ready,
        enabled: r?.enabled ?? (id === "MOCK"),
        sandbox: r?.sandbox ?? true,
      };
    };
    return [
      read("IYZICO", "iyzico", true),
      read("PAYTR", "PayTR", true),
      read("STRIPE", "Stripe", true),
    ];
  }

  // ---------- iyzico ----------

  private async iyzicoClient(): Promise<{
    client: IyzipayClient;
    extra: IyzicoExtra;
    sandbox: boolean;
  }> {
    const cfg = await this.prisma.paymentProviderConfig.findUnique({
      where: { provider: "IYZICO" },
    });
    if (!cfg || !cfg.apiKey || !cfg.secretKey) {
      throw new BadRequestException("iyzico yapılandırılmamış: API key/secret eksik.");
    }
    const apiKey = cfg.apiKey.trim();
    const secretKey = cfg.secretKey.trim();
    const extra = (cfg.extra ?? {}) as IyzicoExtra;
    const uri = this.baseUrlFor("IYZICO", cfg.sandbox, extra);
    const keyHint = this.iyzicoKeyModeHint(apiKey, cfg.sandbox);
    if (keyHint) this.logger.warn(`iyzico: ${keyHint}`);
    this.logger.debug(`iyzico client uri=${uri} sandbox=${cfg.sandbox}`);
    const client = new Iyzipay({
      apiKey,
      secretKey,
      uri,
    });
    return { client, extra: { ...extra, locale: extra.locale ?? "tr" }, sandbox: cfg.sandbox };
  }

  /**
   * Validate credentials with a cheap roundtrip to iyzico.
   * Uses checkoutFormInitialize with minimal data; iyzico returns a specific
   * "invalid credentials" error if api/secret are bad.
   */
  async testIyzico(input?: {
    apiKey?: string;
    secretKey?: string;
    sandbox?: boolean;
    baseUrl?: string;
  }): Promise<{ ok: boolean; message: string; errorCode?: string }> {
    let apiKey: string | null | undefined = input?.apiKey;
    let secretKey: string | null | undefined = input?.secretKey;
    let sandbox: boolean | undefined = input?.sandbox;
    let baseUrl: string | undefined = input?.baseUrl;

    if (!apiKey || !secretKey || sandbox === undefined) {
      const cfg = await this.prisma.paymentProviderConfig.findUnique({
        where: { provider: "IYZICO" },
      });
      apiKey = apiKey ?? cfg?.apiKey ?? undefined;
      secretKey = secretKey ?? cfg?.secretKey ?? undefined;
      sandbox = sandbox ?? cfg?.sandbox ?? true;
      const ex = (cfg?.extra ?? {}) as IyzicoExtra;
      baseUrl = baseUrl ?? ex.baseUrl ?? undefined;
    }

    if (!apiKey || !secretKey) {
      return { ok: false, message: "API key ve secret gereklidir." };
    }

    const trimmedKey = apiKey.trim();
    const trimmedSecret = secretKey.trim();
    const sandboxMode = sandbox ?? true;
    const extraForUrl: IyzicoExtra = { baseUrl };
    const uri = this.baseUrlFor("IYZICO", sandboxMode, extraForUrl);
    const keyHint = this.iyzicoKeyModeHint(trimmedKey, sandboxMode);

    const client = new Iyzipay({
      apiKey: trimmedKey,
      secretKey: trimmedSecret,
      uri,
    });

    try {
      const res = await promisify<any>(
        client.checkoutFormInitialize,
        client.checkoutFormInitialize.create,
        {
          locale: "tr",
          conversationId: `conn-test-${Date.now()}`,
          price: "1.00",
          paidPrice: "1.00",
          currency: "TRY",
          basketId: "conn-test",
          paymentGroup: "PRODUCT",
          callbackUrl: "https://example.com/callback",
          enabledInstallments: [1],
          buyer: {
            id: "ct1",
            name: "Test",
            surname: "User",
            gsmNumber: "+905551112233",
            email: "test@example.com",
            identityNumber: "11111111111",
            registrationAddress: "Test",
            ip: "85.34.78.112",
            city: "Istanbul",
            country: "Turkey",
          },
          shippingAddress: {
            contactName: "Test User",
            city: "Istanbul",
            country: "Turkey",
            address: "Test",
          },
          billingAddress: {
            contactName: "Test User",
            city: "Istanbul",
            country: "Turkey",
            address: "Test",
          },
          basketItems: [
            {
              id: "BI1",
              name: "Test",
              category1: "Test",
              itemType: "VIRTUAL",
              price: "1.00",
            },
          ],
        },
      );
      if (res?.status === "success") {
        return { ok: true, message: "Bağlantı başarılı. Sandbox hazır." };
      }
      const code = res?.errorCode != null ? String(res.errorCode) : undefined;
      return {
        ok: false,
        message: `${res?.errorMessage ?? "Bilinmeyen hata"}${this.iyzicoErrorHint(code, sandboxMode)}${keyHint ? ` ${keyHint}` : ""}`,
        errorCode: code,
      };
    } catch (e: any) {
      const msg = typeof e === "string" ? e : e?.message ?? JSON.stringify(e);
      return { ok: false, message: `Bağlantı hatası: ${msg}` };
    }
  }

  /**
   * Start iyzico Checkout Form flow for an existing PENDING order.
   * Returns the hosted paymentPageUrl to redirect the customer to.
   */
  async startIyzicoCheckout(input: {
    orderId: string;
    buyer?: {
      name?: string;
      surname?: string;
      email?: string;
      phone?: string;
      identityNumber?: string;
      address?: string;
      city?: string;
      country?: string;
      ip?: string;
    };
    origin?: string; // frontend origin (for return url fallback)
    apiOrigin?: string; // backend origin (for callback url fallback)
  }): Promise<{ paymentPageUrl: string; token: string; paymentId: string }> {
    const order = await this.prisma.order.findUnique({
      where: { id: input.orderId },
      include: {
        items: { include: { product: { include: { category: true } } } },
      },
    });
    if (!order) throw new NotFoundException("Sipariş bulunamadı");
    if (order.status !== "PENDING") throw new BadRequestException("Sipariş ödenmiş durumda");
    if (!order.items.length) throw new BadRequestException("Sipariş kalemi yok");

    const { client, extra, sandbox } = await this.iyzicoClient();

    const callbackUrl =
      extra.callbackUrl?.trim() ||
      `${(input.apiOrigin ?? "http://localhost:4000").replace(/\/$/, "")}/api/payments/iyzico/callback`;

    const email = input.buyer?.email || order.guestEmail || "customer@example.com";
    const fullName = (input.buyer?.name || "").trim() || "Misafir Müşteri";
    const [firstName, ...rest] = fullName.split(/\s+/);
    const surname = (input.buyer?.surname || rest.join(" ") || "Müşteri").trim();

    const price = (order.subtotalCents / 100).toFixed(2);
    const paidPrice = (order.totalCents / 100).toFixed(2);

    const request: Record<string, unknown> = {
      locale: extra.locale ?? "tr",
      conversationId: order.id,
      price,
      paidPrice,
      currency: order.currency || "TRY",
      basketId: order.id,
      paymentGroup: "PRODUCT",
      callbackUrl,
      enabledInstallments: [1, 2, 3, 6, 9],
      buyer: {
        id: order.buyerUserId || order.id,
        name: firstName || "Müşteri",
        surname,
        gsmNumber: input.buyer?.phone || "+905555555555",
        email,
        identityNumber: input.buyer?.identityNumber || "11111111111",
        registrationAddress: input.buyer?.address || "N/A",
        ip: input.buyer?.ip || "85.34.78.112",
        city: input.buyer?.city || "Istanbul",
        country: input.buyer?.country || "Turkey",
      },
      shippingAddress: {
        contactName: fullName,
        city: input.buyer?.city || "Istanbul",
        country: input.buyer?.country || "Turkey",
        address: input.buyer?.address || "N/A",
      },
      billingAddress: {
        contactName: fullName,
        city: input.buyer?.city || "Istanbul",
        country: input.buyer?.country || "Turkey",
        address: input.buyer?.address || "N/A",
      },
      basketItems: order.items.map((it, idx) => ({
        id: it.id || `item-${idx}`,
        name: it.titleSnapshot.slice(0, 120),
        category1: it.product?.category?.name || "Genel",
        itemType: "PHYSICAL",
        price: ((it.unitPriceCents * it.quantity) / 100).toFixed(2),
      })),
    };

    const res = await promisify<any>(
      client.checkoutFormInitialize,
      client.checkoutFormInitialize.create,
      request,
    );

    if (res?.status !== "success") {
      const code = res?.errorCode != null ? String(res.errorCode) : undefined;
      throw new BadRequestException(
        `iyzico reddetti: ${res?.errorMessage ?? "bilinmeyen hata"} (${code ?? "-"})${this.iyzicoErrorHint(code, sandbox)}`,
      );
    }

    const token: string = res.token;
    const paymentPageUrl: string = res.paymentPageUrl;

    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        provider: "IYZICO",
        externalId: token,
        amountCents: order.totalCents,
        currency: order.currency,
        status: "initiated",
        rawResponse: res as Prisma.InputJsonValue,
      },
    });

    return { paymentPageUrl, token, paymentId: payment.id };
  }

  /**
   * Called after iyzico posts the user back to our callbackUrl with { token }.
   * Retrieves the final payment result and updates order + payment.
   * Returns a URL on the frontend to redirect the browser to.
   */
  async handleIyzicoCallback(input: {
    token: string;
    origin?: string;
  }): Promise<{ redirectUrl: string; ok: boolean; orderId: string | null }> {
    if (!input.token) {
      return {
        ok: false,
        orderId: null,
        redirectUrl: this.buildReturnUrl(input.origin, null, "missing_token"),
      };
    }

    const existing = await this.prisma.payment.findFirst({
      where: { provider: "IYZICO", externalId: input.token },
      orderBy: { createdAt: "desc" },
    });
    if (!existing || !existing.orderId) {
      return {
        ok: false,
        orderId: null,
        redirectUrl: this.buildReturnUrl(input.origin, null, "unknown_token"),
      };
    }

    const { client, extra } = await this.iyzicoClient();
    let res: any;
    try {
      res = await promisify<any>(client.checkoutForm, client.checkoutForm.retrieve, {
        locale: extra.locale ?? "tr",
        conversationId: existing.orderId,
        token: input.token,
      });
    } catch (e: any) {
      this.logger.error(`iyzico retrieve failed: ${e?.message ?? e}`);
      await this.prisma.payment.update({
        where: { id: existing.id },
        data: {
          status: "error",
          rawResponse: { error: String(e?.message ?? e) } as Prisma.InputJsonValue,
        },
      });
      return {
        ok: false,
        orderId: existing.orderId,
        redirectUrl: this.buildReturnUrl(input.origin, existing.orderId, "retrieve_failed"),
      };
    }

    const success = res?.status === "success" && res?.paymentStatus === "SUCCESS";
    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: existing.id },
        data: {
          status: success ? "succeeded" : (res?.paymentStatus?.toLowerCase() || "failed"),
          rawResponse: res as Prisma.InputJsonValue,
        },
      });
      if (success) {
        await tx.order.update({
          where: { id: existing.orderId! },
          data: { status: "PAID" },
        });
        const order = await tx.order.findUnique({
          where: { id: existing.orderId! },
          select: { buyerUserId: true },
        });
        if (order?.buyerUserId) {
          const cart = await tx.cart.findUnique({ where: { userId: order.buyerUserId } });
          if (cart) {
            await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
          }
        }
      }
    });

    if (success && existing.orderId) {
      try {
        await this.orders.fulfillPaidOrder(existing.orderId);
      } catch (e) {
        this.logger.error(
          `fulfillPaidOrder failed for ${existing.orderId}: ${e instanceof Error ? e.message : e}`,
        );
      }
    }

    const frontend = (extra.frontendUrl || input.origin || "http://localhost:3000").replace(
      /\/$/,
      "",
    );
    const url = success
      ? `${frontend}/checkout/iyzico-return?orderId=${encodeURIComponent(existing.orderId!)}&status=success`
      : `${frontend}/checkout/iyzico-return?orderId=${encodeURIComponent(existing.orderId!)}&status=failed&reason=${encodeURIComponent(res?.errorMessage || res?.paymentStatus || "failed")}`;
    return { ok: success, orderId: existing.orderId, redirectUrl: url };
  }

  private buildReturnUrl(
    origin: string | undefined,
    orderId: string | null,
    reason: string,
  ): string {
    const base = (origin || "http://localhost:3000").replace(/\/$/, "");
    const q = new URLSearchParams({ status: "failed", reason });
    if (orderId) q.set("orderId", orderId);
    return `${base}/checkout/iyzico-return?${q.toString()}`;
  }

  // ---------- Legacy mock ----------

  /**
   * İade talebi onaylandığında (APPROVED) siparişteki iyzico ödemesine göre kalem bazlı kısmi iade dener.
   * MOCK ödemelerde gerçek API çağrısı yapılmaz (SKIPPED).
   */
  async tryRefundForReturnApproved(input: {
    returnRequestId: string;
    orderId: string;
    lines: { orderItemId: string; quantity: number }[];
  }): Promise<{ outcome: "SUCCEEDED" | "SKIPPED" | "FAILED"; cents: number; detail?: string }> {
    const order = await this.prisma.order.findUnique({
      where: { id: input.orderId },
      include: { items: true, payments: { orderBy: { createdAt: "desc" } } },
    });
    if (!order) {
      return { outcome: "FAILED", cents: 0, detail: "order_not_found" };
    }

    const byItem = new Map(order.items.map((i) => [i.id, i]));
    let refundCents = 0;
    for (const line of input.lines) {
      const oi = byItem.get(line.orderItemId);
      if (!oi) continue;
      refundCents += oi.unitPriceCents * line.quantity;
    }

    const payment = order.payments.find((p) => p.status === "succeeded");
    if (!payment) {
      return { outcome: "SKIPPED", cents: refundCents, detail: "basarili_odeme_kaydi_yok" };
    }

    if (payment.provider === "MOCK") {
      this.logger.log(
        `[refund:skip] return=${input.returnRequestId} order=${input.orderId} MOCK ödeme (${refundCents} kurus)`,
      );
      return { outcome: "SKIPPED", cents: refundCents, detail: "mock_odeme" };
    }

    if (payment.provider !== "IYZICO") {
      return { outcome: "SKIPPED", cents: refundCents, detail: `desteklenmeyen_odeme:${payment.provider}` };
    }

    const raw = payment.rawResponse as Record<string, unknown> | null;
    const txs = this.parseIyzicoItemTransactions(raw);
    if (!txs.length) {
      return {
        outcome: "FAILED",
        cents: refundCents,
        detail: "iyzico_cevabinda_itemTransactions_yok",
      };
    }

    const { client, extra } = await this.iyzicoClient();
    const currency = String(raw?.currency ?? order.currency ?? "TRY");
    const ip = process.env.IYZICO_REFUND_IP?.trim() || "85.34.78.112";

    for (const line of input.lines) {
      const oi = byItem.get(line.orderItemId);
      if (!oi || line.quantity <= 0) continue;

      const tx = txs.find((t) => t.itemId === oi.id);
      if (!tx) {
        return {
          outcome: "FAILED",
          cents: refundCents,
          detail: `odeme_kalemi_bulunamadi:${oi.id}`,
        };
      }

      const lineCents = oi.unitPriceCents * line.quantity;
      let refundTry = lineCents / 100;
      if (tx.paidPrice != null && oi.quantity > 0) {
        const maxForReturn = (tx.paidPrice * line.quantity) / oi.quantity;
        refundTry = Math.min(refundTry, maxForReturn);
      }
      if (refundTry <= 0) continue;

      const priceStr = refundTry.toFixed(2);
      const convId = `ret-${input.returnRequestId.slice(0, 12)}-${oi.id.slice(0, 8)}`;

      const res: any = await new Promise((resolve, reject) => {
        client.refund.create(
          {
            locale: extra.locale ?? "tr",
            conversationId: convId,
            paymentTransactionId: tx.paymentTransactionId,
            price: priceStr,
            currency,
            ip,
            reason: "OTHER",
            description: `Iade ${input.returnRequestId.slice(0, 8)}`,
          },
          (err: unknown, body: unknown) => {
            if (err) reject(err);
            else resolve(body);
          },
        );
      });

      if (res?.status !== "success") {
        return {
          outcome: "FAILED",
          cents: refundCents,
          detail: `${res?.errorCode ?? "refund"}:${res?.errorMessage ?? JSON.stringify(res).slice(0, 200)}`,
        };
      }
    }

    this.logger.log(
      `[refund:ok] return=${input.returnRequestId} order=${input.orderId} ~${refundCents} kurus`,
    );
    return { outcome: "SUCCEEDED", cents: refundCents };
  }

  private parseIyzicoItemTransactions(raw: unknown): Array<{
    itemId: string;
    paymentTransactionId: string;
    paidPrice?: number;
  }> {
    if (!raw || typeof raw !== "object") return [];
    const o = raw as Record<string, unknown>;
    const arr = o.itemTransactions;
    if (!Array.isArray(arr)) return [];
    const out: Array<{ itemId: string; paymentTransactionId: string; paidPrice?: number }> = [];
    for (const row of arr) {
      if (!row || typeof row !== "object") continue;
      const r = row as Record<string, unknown>;
      const itemId = r.itemId != null ? String(r.itemId) : "";
      const paymentTransactionId =
        r.paymentTransactionId != null ? String(r.paymentTransactionId) : "";
      if (!itemId || !paymentTransactionId) continue;
      const paidPrice = r.paidPrice != null ? Number(r.paidPrice) : undefined;
      out.push({ itemId, paymentTransactionId, paidPrice });
    }
    return out;
  }

  async mockCheckout(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException();
    if (order.status !== "PENDING") throw new BadRequestException("Order not payable");
    const payment = await this.prisma.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: {
          orderId,
          provider: "MOCK",
          externalId: `mock_${orderId}`,
          amountCents: order.totalCents,
          currency: order.currency,
          status: "succeeded",
          rawResponse: { note: "Replace with iyzico/PayTR/Stripe SDK call" },
        },
      });
      await tx.order.update({ where: { id: orderId }, data: { status: "PAID" } });
      return p;
    });
    await this.orders.fulfillPaidOrder(orderId);
    return { payment, message: "Order marked PAID (mock). Wire real provider here." };
  }

  listProviders(): { id: PaymentProvider; name: string; ready: boolean }[] {
    return [
      { id: "MOCK", name: "Mock", ready: true },
      { id: "IYZICO", name: "iyzico", ready: true },
      { id: "PAYTR", name: "PayTR", ready: false },
      { id: "STRIPE", name: "Stripe", ready: false },
    ];
  }
}
