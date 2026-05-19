import Image from "next/image";
import { cn } from "@/lib/cn";

/** Sepet / ödeme satırı küçük ürün görseli — düşük kalite, lazy. */
export function ThumbImage({
  src,
  alt,
  size = 112,
  className,
}: {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn("h-full w-full object-cover", className)}
      sizes={`${size}px`}
      quality={65}
      loading="lazy"
    />
  );
}
