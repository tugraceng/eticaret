import { Injectable, NotFoundException } from "@nestjs/common";
import type { HomeSectionKind, Prisma } from "@prisma/client";
import { AppCacheService } from "../common/cache/app-cache.service";
import { PrismaService } from "../prisma/prisma.service";

const KEY_PUBLIC = "settings:public";
const KEY_HOME_VISIBLE = "home-sections:visible";
const KEY_HOME_ALL = "home-sections:all";
const TTL_MS = 60_000;

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: AppCacheService,
  ) {}

  async getSettings() {
    const existing = await this.prisma.siteSettings.findFirst();
    if (existing) return existing;
    return this.prisma.siteSettings.create({ data: {} });
  }

  private invalidateSettings() {
    this.cache.del(KEY_PUBLIC);
  }

  private invalidateHomeSections() {
    this.cache.del(KEY_HOME_VISIBLE);
    this.cache.del(KEY_HOME_ALL);
  }

  /**
   * Herkese açık /settings uç noktası için — hassas alanlar (API anahtarları vs.) maskelenir.
   */
  getPublicSettings() {
    return this.cache.getOrSet(KEY_PUBLIC, TTL_MS, () => this.loadPublicSettings());
  }

  private async loadPublicSettings() {
    const full = await this.getSettings();
    const {
      whatsappAccessToken: _accessToken,
      whatsappPhoneId: _phoneId,
      whatsappShippedTemplate: _tpl,
      whatsappTemplateLang: _waTplLang,
      birthdayCouponAutomationEnabled: _birthdayAuto,
      lowStockThreshold: _lowStock,
      ...safe
    } = full;
    void _accessToken;
    void _phoneId;
    void _tpl;
    void _waTplLang;
    void _birthdayAuto;
    void _lowStock;
    return safe;
  }

  async updateSettings(
    data: Partial<{
      siteName: string;
      logoUrl: string | null;
      faviconUrl: string | null;
      primaryColor: string;
      secondaryColor: string;
      accentColor: string | null;
      fontFamily: string | null;
      contactEmail: string | null;
      contactPhone: string | null;
      address: string | null;
      socialLinks: Record<string, unknown>;
      defaultMetaTitle: string | null;
      defaultMetaDesc: string | null;
      ogImageUrl: string | null;
      shippingFeeCents: number;
      freeShippingThresholdCents: number;
      taxRateBp: number;
      taxIncluded: boolean;
      lowStockThreshold: number;
      whatsappEnabled: boolean;
      whatsappNumber: string | null;
      whatsappGreeting: string | null;
      whatsappPhoneId: string | null;
      whatsappAccessToken: string | null;
      whatsappShippedTemplate: string | null;
      whatsappTemplateLang: string;
      popupEnabled: boolean;
      popupTitle: string | null;
      popupBody: string | null;
      popupCtaLabel: string | null;
      popupCtaHref: string | null;
      popupImageUrl: string | null;
      popupSize: string;
      popupDismissBackdrop: boolean;
      popupSessionOnly: boolean;
      popupStorageKey: string;
      topPromoLine1: string;
      topPromoLine2: string;
      topPromoLine3: string;
      topPromoBgColor: string;
      topPromoTextColor: string;
      topPromoMarqueeDurationSec: number;
      authPanelTitle: string;
      authPanelSubtitle: string;
      authPanelImageUrl: string | null;
      authPanelGradientFrom: string;
      authPanelGradientTo: string;
      authPanelTextColor: string;
      shopRailLeftEnabled: boolean;
      shopRailLeftTitle: string;
      shopRailLeftBody: string;
      shopRailLeftCode: string;
      shopRailLeftCtaLabel: string;
      shopRailLeftCtaHref: string;
      shopRailRightEnabled: boolean;
      shopRailRightTitle: string;
      shopRailRightBody: string;
      shopRailRightCode: string;
      shopRailRightCtaLabel: string;
      shopRailRightCtaHref: string;
      birthdayCouponAutomationEnabled: boolean;
    }>,
  ) {
    const current = await this.getSettings();
    const updated = await this.prisma.siteSettings.update({
      where: { id: current.id },
      data: {
        ...data,
        socialLinks: data.socialLinks as Prisma.InputJsonValue | undefined,
      },
    });
    this.invalidateSettings();
    return updated;
  }

  listHomeSections(opts?: { onlyVisible?: boolean }) {
    const key = opts?.onlyVisible ? KEY_HOME_VISIBLE : KEY_HOME_ALL;
    return this.cache.getOrSet(key, TTL_MS, () =>
      this.prisma.homeSection.findMany({
        where: opts?.onlyVisible ? { isVisible: true } : undefined,
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      }),
    );
  }

  async createHomeSection(data: {
    kind: HomeSectionKind;
    title?: string | null;
    subtitle?: string | null;
    body?: string | null;
    mediaUrl?: string | null;
    ctaLabel?: string | null;
    ctaHref?: string | null;
    config?: unknown;
    isVisible?: boolean;
    sortOrder?: number;
  }) {
    const config = this.normalizeHomeSectionConfig(data.config);
    const created = await this.prisma.homeSection.create({
      data: {
        kind: data.kind,
        title: data.title ?? undefined,
        subtitle: data.subtitle ?? undefined,
        body: data.body ?? undefined,
        mediaUrl: data.mediaUrl ?? undefined,
        ctaLabel: data.ctaLabel ?? undefined,
        ctaHref: data.ctaHref ?? undefined,
        config: config as Prisma.InputJsonValue,
        isVisible: data.isVisible ?? true,
        sortOrder: data.sortOrder ?? 0,
      },
    });
    this.invalidateHomeSections();
    return created;
  }

  async updateHomeSection(
    id: string,
    data: Partial<{
      title: string | null;
      subtitle: string | null;
      body: string | null;
      mediaUrl: string | null;
      ctaLabel: string | null;
      ctaHref: string | null;
      config: unknown;
      isVisible: boolean;
      sortOrder: number;
    }>,
  ) {
    await this.ensureSection(id);
    const { config, ...rest } = data;
    const normalizedConfig = config === undefined ? undefined : this.normalizeHomeSectionConfig(config);
    const updated = await this.prisma.homeSection.update({
      where: { id },
      data: {
        ...rest,
        config: normalizedConfig as Prisma.InputJsonValue | undefined,
      },
    });
    this.invalidateHomeSections();
    return updated;
  }

  async removeHomeSection(id: string) {
    await this.ensureSection(id);
    const removed = await this.prisma.homeSection.delete({ where: { id } });
    this.invalidateHomeSections();
    return removed;
  }

  async reorderHomeSections(ids: string[]) {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.homeSection.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );
    this.invalidateHomeSections();
    return this.listHomeSections();
  }

  private async ensureSection(id: string) {
    const s = await this.prisma.homeSection.findUnique({ where: { id } });
    if (!s) throw new NotFoundException();
  }

  /**
   * HomeSection config backend tarafında opsiyonel tutulur.
   * Frontend alanı göndermese veya boş/null gönderse bile güvenli fallback {} olur.
   */
  private normalizeHomeSectionConfig(input: unknown): Record<string, unknown> {
    if (input == null) return {};
    if (typeof input === "string") {
      const trimmed = input.trim();
      if (!trimmed) return {};
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          return parsed as Record<string, unknown>;
        }
        return {};
      } catch {
        return {};
      }
    }
    if (typeof input === "object" && !Array.isArray(input)) {
      return input as Record<string, unknown>;
    }
    return {};
  }
}
