import { Injectable, Logger } from "@nestjs/common";

type Handler<T> = (payload: T) => Promise<unknown> | unknown;

type EnqueueOptions = {
  /** Başarısızlıkta kaç kez yeniden denensin (toplam attempt = retries + 1). Default 2. */
  retries?: number;
  /** İlk denemeden önce beklenecek ms. Default 0. */
  delayMs?: number;
  /** Exponential backoff base (ms). Default 250. */
  backoffMs?: number;
  /** Log/trace için okunur isim. */
  name?: string;
};

/**
 * Hafif in-process job kuyruğu. Response akışını bloklamadan çalışır.
 *
 * Tasarım notu:
 * - Redis / BullMQ zorunluluğu yok; tek instance backend için yeterli.
 * - Çoklu instance'a geçildiğinde bu servisin arkasına BullMQ/pg-boss konulabilir;
 *   API (enqueue/registerHandler) aynı kalacak şekilde tasarlandı.
 * - Hata durumunda exponential backoff + kuyruktan düşmeden önce dead-letter log.
 */
@Injectable()
export class JobQueueService {
  private readonly logger = new Logger("JobQueue");
  private readonly handlers = new Map<string, Handler<unknown>>();

  registerHandler<T>(topic: string, handler: Handler<T>) {
    this.handlers.set(topic, handler as Handler<unknown>);
  }

  /**
   * Job'u kuyruğa al. Response'u bekletmez (fire-and-forget).
   * `topic` için kayıtlı handler yoksa sadece uyarı loglar.
   */
  enqueue<T>(topic: string, payload: T, opts: EnqueueOptions = {}) {
    const retries = opts.retries ?? 2;
    const delayMs = Math.max(0, opts.delayMs ?? 0);
    const backoff = Math.max(50, opts.backoffMs ?? 250);
    const name = opts.name ?? topic;

    const run = (attempt: number) => {
      const handler = this.handlers.get(topic);
      if (!handler) {
        this.logger.warn(`Handler yok: topic="${topic}" — job atlandı (${name}).`);
        return;
      }
      Promise.resolve()
        .then(() => handler(payload))
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          if (attempt < retries) {
            const wait = backoff * Math.pow(2, attempt);
            this.logger.warn(
              `Job "${name}" hatası (deneme ${attempt + 1}/${retries + 1}): ${msg} — ${wait}ms sonra yeniden.`,
            );
            setTimeout(() => run(attempt + 1), wait).unref?.();
          } else {
            this.logger.error(
              `Job "${name}" DLQ (son deneme ${attempt + 1}/${retries + 1}): ${msg}`,
            );
          }
        });
    };

    if (delayMs) {
      setTimeout(() => run(0), delayMs).unref?.();
    } else {
      // setImmediate, response döndükten sonra çalışmayı garanti eder.
      setImmediate(() => run(0));
    }
  }
}
