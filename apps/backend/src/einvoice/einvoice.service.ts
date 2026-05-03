import { Injectable, Logger } from "@nestjs/common";

/**
 * Yasal e-fatura / GİB entegrasyonu için kanca.
 * EINVOICE_PROVIDER boş veya `none` iken yalnızca no-op; gerçek sağlayıcıda kuyruk veya HTTP çağrısı eklenebilir.
 */
@Injectable()
export class EinvoiceService {
  private readonly log = new Logger(EinvoiceService.name);

  onOrderCreated(orderId: string) {
    const provider = (process.env.EINVOICE_PROVIDER ?? "").trim().toLowerCase();
    if (!provider || provider === "none") return;
    this.log.log(`E-fatura kuyruğu (sağlayıcı=${provider}) sipariş=${orderId} — yer tutucu.`);
  }
}
