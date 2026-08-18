"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useCountdown } from "@/hooks/useCountdown";
import { FlashSale, Product } from "@/types/product.types";

// ── Countdown digit ─────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, "0");

function Digit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="tabular-nums text-2xl font-bold text-white leading-none">
        {pad(value)}
      </span>
      <span className="text-[9px] uppercase tracking-widest text-red-200 mt-0.5">
        {label}
      </span>
    </div>
  );
}

// ── Product mini-card ─────────────────────────────────────────────────────────

function SaleCard({ product }: { product: Product }) {
  const mainImage = product.images?.sort((a, b) => a.serialNo - b.serialNo)[0];
  const [hovered, setHovered] = useState(false);
  const secondImage = product.images?.sort((a, b) => a.serialNo - b.serialNo)[1];

  const hasDiscount = product.basePrice - product.price >= 1;
  const discountLabel =
    product.discountType === "PERCENT"
      ? `${product.discount}% Off`
      : `৳${product.discount} Off`;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative aspect-3/4 overflow-hidden bg-gray-100 mb-2">
        {mainImage && (
          <img
            src={hovered && secondImage ? secondImage.image : mainImage.image}
            alt={product.title}
            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.04]"
          />
        )}

        {hasDiscount && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-bold uppercase tracking-wide px-2 py-0.5">
            {discountLabel}
          </span>
        )}
      </div>

      <p className="text-[11px] text-gray-700 leading-snug line-clamp-2 mb-1">
        {product.title}
      </p>

      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold text-red-600">
          ৳{product.price.toLocaleString()}
        </span>
        {hasDiscount && (
          <span className="text-[10px] text-gray-400 line-through">
            ৳{product.basePrice.toLocaleString()}
          </span>
        )}
      </div>
    </Link>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface HomepageFlashSaleProps {
  flashSale: FlashSale;
}

export default function HomepageFlashSale({ flashSale }: HomepageFlashSaleProps) {
  const endDate = new Date(flashSale.endDate);
  const timeLeft = useCountdown(endDate);

  const products = flashSale.products;
  if (products.length === 0) return null;

  const productCount = products.length;

  return (
    <section className="w-full px-4 md:px-8 lg:px-16 py-10">
      <div className="max-w-360 mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">

        {/* ── Left: editorial panel ── */}
        <div className="rounded-xl bg-linear-to-br from-red-700 to-rose-500 px-7 py-8 flex flex-col justify-between min-h-[220px] lg:self-stretch">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-200 mb-3">
              Limited Time
            </p>
            <h2 className="text-3xl font-bold text-white leading-tight mb-2 whitespace-pre-line">
              {flashSale.title}
            </h2>
            <p className="text-sm text-red-100 leading-relaxed">
              {flashSale.subtitle ??
                "Exclusive discounts on select furniture & décor — while stocks last."}
            </p>
          </div>

          {timeLeft && (
            <div className="mt-6">
              <p className="text-[9px] uppercase tracking-widest text-red-200 mb-2">
                Ends in
              </p>
              <div className="flex items-end gap-3">
                <Digit value={timeLeft.hours} label="hrs" />
                <span className="text-white text-xl font-bold mb-3 leading-none">:</span>
                <Digit value={timeLeft.minutes} label="min" />
                <span className="text-white text-xl font-bold mb-3 leading-none">:</span>
                <Digit value={timeLeft.seconds} label="sec" />
              </div>
            </div>
          )}

          <Link
            href="/sales"
            className="mt-6 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-white border-b border-white/40 hover:border-white pb-0.5 transition-colors w-fit"
          >
            Shop All Sale
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* ── Right: product grid ── */}
        <div className={`grid grid-cols-2 ${productCount > 2 ? "sm:grid-cols-4" : "sm:grid-cols-2"} gap-4`}>
          {products.map((p) => (
            <SaleCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
