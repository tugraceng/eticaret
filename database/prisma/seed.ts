import { HomeSectionKind, PrismaClient, UserRole, type Prisma } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

/** Başlangıç popup metni — üretimde panelden güncellenir. */
const SAMPLE_POPUP = {
  popupEnabled: true,
  popupTitle: "Yeni baskılar vitrine eklendi",
  popupBody:
    "Anahtarlık, figür ve hediye setlerinde yeni modeller.\n\nBelirlenen sepet tutarının üzerinde ücretsiz kargo ayrıntıları için mağazamızı ziyaret edin.",
  popupCtaLabel: "Ürünlere git",
  popupCtaHref: "/shop",
  popupImageUrl:
    "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?auto=format&w=900&q=80",
  popupSize: "md" as const,
  popupDismissBackdrop: true,
  popupSessionOnly: false,
  popupStorageKey: "promo-v1",
};

/** Mağaza / ürün sayfası yan şerit kampanyaları */
const SAMPLE_SHOP_RAILS = {
  shopRailLeftEnabled: true,
  shopRailLeftTitle: "İlk siparişe özel",
  shopRailLeftBody:
    "Sepetinizi tamamladığınızda geçerli %10 indirim kodu. Tek kullanımlık; stoklu ürünlerde.",
  shopRailLeftCode: "ILK3D10",
  shopRailLeftCtaLabel: "Koleksiyonu aç",
  shopRailLeftCtaHref: "/shop",
  shopRailRightEnabled: true,
  shopRailRightTitle: "Kargo avantajı",
  shopRailRightBody:
    "2.500 TL ve üzeri siparişlerde standart kargo ücretsiz. Kırılmaya karşı özenli paketleme.",
  shopRailRightCode: "",
  shopRailRightCtaLabel: "Teslimat bilgisi",
  shopRailRightCtaHref: "/teslimat-iade",
};

/** Ürün görselleri — basılmış ürün / hediyelik vitrin (Unsplash) */
const PICS = {
  figurines:
    "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?auto=format&w=800&q=80",
  keychains:
    "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&w=800&q=80",
  deskDecor:
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&w=800&q=80",
  giftBox:
    "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&w=800&q=80",
  translucent:
    "https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&w=800&q=80",
  coasters:
    "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&w=800&q=80",
  lampBody:
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&w=800&q=80",
} as const;

async function setProductImages(
  productId: string,
  images: { url: string; alt: string; sortOrder: number }[],
) {
  await prisma.productImage.deleteMany({ where: { productId } });
  if (images.length === 0) return;
  await prisma.productImage.createMany({ data: images.map((i) => ({ productId, ...i })) });
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim() || "admin@store.local";
  const adminPassword = process.env.ADMIN_PASSWORD?.trim() || "ChangeMe123!";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      passwordHash,
      name: "Mağaza Yöneticisi",
      role: UserRole.ADMIN,
    },
    update: { passwordHash, role: UserRole.ADMIN },
  });

  const settingsCount = await prisma.siteSettings.count();
  if (settingsCount === 0) {
    await prisma.siteSettings.create({
      data: {
        siteName: "3D Baskı Atölyesi",
        primaryColor: "#0f172a",
        secondaryColor: "#0ea5e9",
        defaultMetaTitle: "3D Baskı Atölyesi — Anahtarlık, figür ve hediyelik",
        defaultMetaDesc:
          "Atölyemizde bastığımız 3D ürünler: anahtarlık, figür, masaüstü aksesuar ve hediye setleri. Stoktan gönderim ve güvenli ödeme.",
        socialLinks: {},
        ...SAMPLE_POPUP,
        ...SAMPLE_SHOP_RAILS,
      },
    });
  } else {
    const existing = await prisma.siteSettings.findFirst();
    if (existing) {
      if (process.env.SEED_SKIP_SAMPLE_POPUP !== "1" && !existing.popupTitle?.trim()) {
        await prisma.siteSettings.update({
          where: { id: existing.id },
          data: { ...SAMPLE_POPUP },
        });
      }
      if (
        process.env.SEED_SKIP_SAMPLE_SHOP_RAILS !== "1" &&
        !existing.shopRailLeftTitle?.trim() &&
        !existing.shopRailRightTitle?.trim()
      ) {
        await prisma.siteSettings.update({
          where: { id: existing.id },
          data: { ...SAMPLE_SHOP_RAILS },
        });
      }
    }
  }

  const catGenel = await prisma.category.upsert({
    where: { slug: "genel" },
    create: { name: "Figürler & koleksiyon", slug: "genel", sortOrder: 0 },
    update: { name: "Figürler & koleksiyon" },
  });

  const catElektronik = await prisma.category.upsert({
    where: { slug: "elektronik" },
    create: { name: "Anahtarlık & taşınabilir", slug: "elektronik", sortOrder: 1 },
    update: { name: "Anahtarlık & taşınabilir" },
  });

  const catEv = await prisma.category.upsert({
    where: { slug: "ev-yasam" },
    create: { name: "Ev & masaüstü", slug: "ev-yasam", sortOrder: 2 },
    update: { name: "Ev & masaüstü" },
  });

  const catAks = await prisma.category.upsert({
    where: { slug: "aksesuar" },
    create: { name: "Hediye setleri", slug: "aksesuar", sortOrder: 3 },
    update: { name: "Hediye setleri" },
  });

  type SeedP = {
    slug: string;
    name: string;
    description: string;
    priceCents: number;
    compareAtCents?: number;
    stock: number;
    categoryId: string;
    image: { url: string; alt: string };
  };

  const toSeed: SeedP[] = [
    {
      slug: "starter-kit",
      name: "Hediye başlangıç seti",
      description:
        "Üçlü paket: anahtarlık, mini figür ve minik stand. Hediye kutusuna uyumlu; stok renkleri ürün görsellerinde.",
      priceCents: 899_00,
      stock: 25,
      categoryId: catAks.id,
      image: { url: PICS.giftBox, alt: "Hediye kutusunda 3D baskı seti" },
    },
    {
      slug: "studio-kulaklik-pro",
      name: "Kişisel anahtarlık — geometrik",
      description:
        "Atölyede bastığımız dayanıklı anahtarlık. İsim veya kısa yazı için sipariş notunda belirtin. Renk seçenekleri aşağıda.",
      priceCents: 189_00,
      compareAtCents: 249_00,
      stock: 40,
      categoryId: catElektronik.id,
      image: { url: PICS.keychains, alt: "3D baskı anahtarlık" },
    },
    {
      slug: "akilli-saat-nova",
      name: "Koleksiyon minyatürü",
      description:
        "Raf veya vitrin için detaylı baskı; yüzey pürüzleri azaltılmış, sergilemeye hazır.",
      priceCents: 349_00,
      compareAtCents: 429_00,
      stock: 32,
      categoryId: catGenel.id,
      image: { url: PICS.figurines, alt: "3D baskı minyatür figür" },
    },
    {
      slug: "mekanik-klavye-x1",
      name: "Masa düzenleyici & telefon standı",
      description:
        "Kablo kanallı tek gövde baskı; telefonunuzu ve küçük aksesuarları düzenli tutar.",
      priceCents: 279_00,
      stock: 60,
      categoryId: catEv.id,
      image: { url: PICS.deskDecor, alt: "Masaüstü 3D baskı düzenleyici" },
    },
    {
      slug: "rahatlama-sandalyesi-aura",
      name: "Şeffaf görünümlü dekor küp",
      description:
        "Işık oyunları için şeffaf veya duman tonlarında baskı. Her biri el ile son kontrolden geçer.",
      priceCents: 129_00,
      compareAtCents: 159_00,
      stock: 12,
      categoryId: catGenel.id,
      image: { url: PICS.translucent, alt: "Şeffaf 3D baskı dekor obje" },
    },
    {
      slug: "masa-lambasi-lumen",
      name: "Geometrik masa lambası gövdesi",
      description:
        "Ampul ve kablo dahil değildir; yaygın duy ölçüleriyle uyumlu 3D baskı gövde. Montaj talimatı pakette.",
      priceCents: 419_00,
      stock: 45,
      categoryId: catEv.id,
      image: { url: PICS.lampBody, alt: "Geometrik 3D baskı lamba gövdesi" },
    },
    {
      slug: "deri-omuz-cantasi-urban",
      name: "Altıgen bardak altlığı seti (6'lı)",
      description: "İçecek izlerine dayanıklı yüzey; aynı sette uyumlu renk tonları. Set seçenekleri aşağıda.",
      priceCents: 239_00,
      stock: 20,
      categoryId: catAks.id,
      image: { url: PICS.coasters, alt: "3D baskı bardak altlığı seti" },
    },
  ];

  const productIds: string[] = [];

  for (const p of toSeed) {
    const { image, ...rest } = p;
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      create: {
        ...rest,
        isPublished: true,
      },
      update: {
        name: rest.name,
        description: rest.description,
        priceCents: rest.priceCents,
        compareAtCents: rest.compareAtCents ?? null,
        stock: rest.stock,
        categoryId: rest.categoryId,
        isPublished: true,
      },
    });
    productIds.push(product.id);
    await setProductImages(product.id, [
      { url: image.url, alt: image.alt, sortOrder: 0 },
    ]);
  }

  /* Varyantlı ürünler — anahtarlık (renk) ve bardak altlığı (set tonu) */
  const withVariants = await Promise.all([
    prisma.product.findUnique({ where: { slug: "studio-kulaklik-pro" }, select: { id: true } }),
    prisma.product.findUnique({ where: { slug: "deri-omuz-cantasi-urban" }, select: { id: true } }),
  ]);
  const [headphoneId, bagId] = withVariants.map((p) => p?.id).filter(Boolean) as string[];
  if (headphoneId) {
    await prisma.productVariant.deleteMany({ where: { productId: headphoneId } });
    await prisma.productVariant.createMany({
      data: [
        { productId: headphoneId, label: "Beyaz", stock: 18, sortOrder: 0 },
        { productId: headphoneId, label: "Gri", stock: 12, sortOrder: 1 },
        { productId: headphoneId, label: "Siyah", stock: 7, sortOrder: 2 },
      ],
    });
    await prisma.product.update({
      where: { id: headphoneId },
      data: { stock: 0 },
    });
  }
  if (bagId) {
    await prisma.productVariant.deleteMany({ where: { productId: bagId } });
    await prisma.productVariant.createMany({
      data: [
        { productId: bagId, label: "Pastel tonlar", stock: 8, sortOrder: 0 },
        { productId: bagId, label: "Nötr & antrasit", stock: 6, sortOrder: 1, priceCents: 259_00 },
      ],
    });
    await prisma.product.update({
      where: { id: bagId },
      data: { stock: 0 },
    });
  }

  const seedHeroSlides = [
    {
      eyebrow: "Atölyeden hazır",
      title: "3D baskı ürünleri",
      body: "Anahtarlık, figür, masaüstü parça ve hediye setleri — hepsi bizim bastığımız ürünler.",
      cta: "/shop",
      ctaLabel: "Ürünlere göz at",
      secondaryHref: "/about",
      secondaryLabel: "Hakkımızda",
      image:
        "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?auto=format&fit=crop&w=2000&q=80",
    },
    {
      eyebrow: "Hediye",
      title: "Doğum günü ve özel günlere",
      body: "Hazır tasarımlar ve seçili kişiselleştirme seçenekleri; özenli paketleme.",
      cta: "/shop",
      ctaLabel: "Hediye fikirleri",
      secondaryHref: "/contact",
      secondaryLabel: "Bize yazın",
      image:
        "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=2000&q=80",
    },
    {
      eyebrow: "Ev & masa",
      title: "Dekor ve düzen",
      body: "Lambası gövdesinden standa: çalışma köşene zarif dokunuş.",
      cta: "/shop",
      ctaLabel: "Keşfet",
      secondaryHref: "/#urunler",
      secondaryLabel: "Vitrin",
      image:
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=2000&q=80",
    },
  ];

  const demoBannerItems = [
    {
      title: "Anahtarlıklar",
      subtitle: "Taşınabilir hediyelik",
      imageUrl: PICS.keychains,
      href: "/shop",
    },
    {
      title: "Figür & minyatür",
      subtitle: "Koleksiyon vitrini",
      imageUrl: PICS.figurines,
      href: "/shop",
    },
    {
      title: "Ev & masaüstü",
      subtitle: "Dekor ve düzen",
      imageUrl: PICS.deskDecor,
      href: "/shop",
    },
  ];

  const demoTrustItems = {
    items: [
      {
        title: "Ücretsiz kargo eşiği",
        description:
          "Belirlenen tutarın üzerindeki siparişlerde standart kargo ücreti tarafımızdan karşılanır.",
      },
      {
        title: "Kolay iade",
        description:
          "Ambalajı açılmamış ve kullanılmamış ürünlerde yasal süre içinde iade ve değişim.",
      },
      {
        title: "3D Secure ödeme",
        description: "Kredi kartı işlemleriniz bankanızın ek doğrulaması ile korunur.",
      },
    ],
  };

  const demoTestimonials = {
    items: [
      {
        quote:
          "Anahtarlık siparişim tam tarif ettiğim gibiydi; paket çok özenliydi.",
        author: "Ayşe K.",
        role: "İstanbul",
      },
      {
        quote:
          "Minyatürün detayı şaşırttı, arkadaşıma hediye gitti çok beğenildi.",
        author: "Mehmet D.",
        role: "Ankara",
      },
      {
        quote:
          "Masa düzenleyici masama tam oturdu. İkinci siparişim için yine buradayım.",
        author: "Deniz T.",
        role: "İzmir",
      },
    ],
  };

  await prisma.blogPost.deleteMany({
    where: {
      slug: {
        in: [
          "ornek-yeni-sezon-koleksiyonu",
          "ornek-kargo-ve-teslimat",
          "ornek-sepet-ipuclari",
        ],
      },
    },
  });

  const demoBlogSlugs = [
    {
      slug: "ilk-3d-baski-rehberi",
      title: "3D baskı hediyelik: hangi ürün kime gider?",
      excerpt: "Anahtarlıktan figüre: hazır modellerle hediye seçimi için kısa rehber.",
      body: "Küçük ama kişisel bir dokunuş isteyenler için anahtarlık ve takı aksesuarları idealdir. Raflarını güzelleştirmek isteyenler için minyatür ve tematik figürler güvenli bir seçimdir.\n\nOfiste veya öğrenci odasında iş görecek hediyeler arıyorsanız masa düzenleyici ve kablo kanallı parçalar hem kullanışlı hem şık durur. Özel yazı veya renk taleplerinizi sipariş notunda paylaşmayı unutmayın.",
      coverImageUrl: PICS.keychains,
    },
    {
      slug: "recine-baskida-guvenlik",
      title: "Siparişiniz nasıl hazırlanıyor?",
      excerpt: "Baskı sonrası kontrol, paketleme ve teslimat hakkında şeffaf özet.",
      body: "Her ürün baskıdan sonra temel görsel kontrolden geçer; kırılgan parçalar koruyucu malzeme ile sarılır. Kargo firması ile birlikte takip numaranız paylaşılır; teslimat süreleri bölgeye göre değişebilir.\n\nKişiselleştirme isteyen siparişlerde üretim süresi biraz uzayabilir; yoğun dönemlerde iletişim kanalımızdan bilgi alabilirsiniz.",
      coverImageUrl: PICS.figurines,
    },
    {
      slug: "filament-saklama-ipuclari",
      title: "3D baskı ürünlerinde renk ve yüzey",
      excerpt: "Mat, hafif parlak veya yarı şeffaf görünüm — ne beklemelisiniz?",
      body: "Baskıda kullandığımız malzeme ve ince ayarlar yüzey dokusunu belirler; ürün sayfalarındaki görseller tipik bitişi yansıtır. Açık renklerde küçük katman çizgileri daha az göze çarpabilir; koyu tonlarda ışık oyunu farklıdır.\n\nTemizlik için genelde hafif nemli bez yeterlidir; aşındırıcı kimyasallardan kaçının. Direkt güneşte uzun süre bırakılan parçalar zamanla renk solmasına açık olabilir.",
      coverImageUrl: PICS.translucent,
    },
  ] as const;

  const nowBlog = new Date();
  for (const p of demoBlogSlugs) {
    await prisma.blogPost.upsert({
      where: { slug: p.slug },
      create: {
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        body: p.body,
        coverImageUrl: p.coverImageUrl,
        publishedAt: nowBlog,
      },
      update: {
        title: p.title,
        excerpt: p.excerpt,
        body: p.body,
        coverImageUrl: p.coverImageUrl,
        publishedAt: nowBlog,
      },
    });
  }

  // Anasayfa bölümleri: seed her çalıştığında yenilenir (SEED_SKIP_HOME_SECTIONS=1 ile atlanır).
  const homeSectionSeedData: Prisma.HomeSectionCreateManyInput[] = [
        {
          kind: HomeSectionKind.HERO,
          config: { slides: seedHeroSlides },
          sortOrder: 0,
        },
        {
          kind: HomeSectionKind.TRUST_STRIP,
          title: "Güvenle alışveriş",
          subtitle: "Hizmet vaatlerimiz",
          config: demoTrustItems,
          sortOrder: 1,
        },
        {
          kind: HomeSectionKind.RAIL_BESTSELLERS,
          title: "En çok satanlar",
          subtitle: "Çok tercih edilen ürünler",
          ctaHref: "/shop",
          config: {},
          sortOrder: 2,
        },
        {
          kind: HomeSectionKind.RAIL_POPULAR,
          title: "Popüler ürünler",
          subtitle: "Trend listesi",
          ctaHref: "/shop?sort=popular",
          config: {},
          sortOrder: 3,
        },
        {
          kind: HomeSectionKind.RAIL_NEWEST,
          title: "Yeni eklenenler",
          subtitle: "Stoğa yeni girenler",
          ctaHref: "/shop?sort=newest",
          config: {},
          sortOrder: 4,
        },
        {
          kind: HomeSectionKind.STORY_STRIP,
          title: "Vitrinden seçkiler",
          subtitle: "Ürün görselleri",
          body: "Yatay kaydırmayla ürünleri inceleyebilirsiniz.",
          config: {},
          sortOrder: 5,
        },
        {
          kind: HomeSectionKind.PROMO_BANNER,
          title: "Kampanyalar ve hızlı teslimat",
          subtitle: "Stoktan gönderim",
          body: "Yeni eklenen anahtarlık ve figürlerde güncel fırsatlar. Sepetinizi tamamlarken kampanya koşullarını kontrol edin.",
          ctaLabel: "Mağazayı aç",
          ctaHref: "/shop",
          config: {},
          sortOrder: 6,
        },
        {
          kind: HomeSectionKind.BANNERS,
          title: "Koleksiyonlara göz atın",
          subtitle: "Hazır baskı ürünleri",
          config: { items: demoBannerItems },
          sortOrder: 7,
        },
        {
          kind: HomeSectionKind.PRODUCT_CATALOG,
          title: "Ürünler",
          subtitle: "Öne çıkan seri",
          config: {},
          sortOrder: 8,
        },
        {
          kind: HomeSectionKind.RICH_TEXT,
          title: "Kendi atölyemizde basıyoruz",
          subtitle: "Mağaza hakkında",
          body:
            "Yazıcı veya yedek parça satmıyoruz; 3D yazıcıyla ürettiğimiz hazır ürünleri sunuyoruz. Anahtarlık, figür, ev dekoru ve hediye setleri siparişlerinizi özenle paketleriz.\n\nToplu hediye veya kurumsal logo talepleri için iletişim kanallarımızdan bize ulaşabilirsiniz.",
          ctaLabel: "Hakkımızda",
          ctaHref: "/about",
          config: {},
          sortOrder: 9,
        },
        {
          kind: HomeSectionKind.BLOG_TEASER,
          title: "Blog",
          subtitle: "Hediye ve ürün ipuçları",
          config: { limit: 3 },
          sortOrder: 10,
        },
        {
          kind: HomeSectionKind.TESTIMONIALS,
          title: "Müşterilerimiz ne diyor?",
          subtitle: "Yorumlar",
          config: demoTestimonials,
          sortOrder: 11,
        },
        {
          kind: HomeSectionKind.CTA,
          title: "Vitrinimize göz atın",
          subtitle: "Mağaza",
          body: "Hazır 3D baskı ürünlerini sepete ekleyin; güvenli ödeme ile siparişinizi tamamlayın.",
          ctaLabel: "Alışverişe geç",
          ctaHref: "/shop",
          config: {},
          sortOrder: 12,
        },
  ];

  if (process.env.SEED_SKIP_HOME_SECTIONS !== "1") {
    await prisma.homeSection.deleteMany();
    await prisma.homeSection.createMany({ data: homeSectionSeedData });
  }

  console.log("Seed OK", {
    admin: admin.email,
    products: productIds.length,
    blogPosts: await prisma.blogPost.count(),
    homeSections: await prisma.homeSection.count(),
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
