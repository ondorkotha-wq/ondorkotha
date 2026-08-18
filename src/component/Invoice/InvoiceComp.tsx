'use client';

import useFetchInvoice from '@/hooks/Invoice/useFetchInvoice';
import { OrderItem } from '@/hooks/Order/useOrders';
import { formatDate } from '@/utils/formatters';
import { useParams, useSearchParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { FullScreenCenter } from '../Screen/FullScreenCenter';
import LoadingDots from '../Loading/LoadingDS';
import useAxiosSecure from '@/hooks/Axios/useAxiosSecure';
import useFetchInvoiceSettings from '@/hooks/Settings/useFetchInvoiceSettings';
import toast from 'react-hot-toast';

// ── tiny helpers ────────────────────────────────────────────────────────────
const taka = (n: number | string) =>
  `৳ ${Number(n).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;

const StatusPill = ({ status }: { status: string }) => {
  const cfg: Record<string, { bg: string; dot: string; label: string }> = {
    PAID:      { bg: 'bg-emerald-50 text-emerald-700 ring-emerald-200',  dot: 'bg-emerald-500', label: 'Paid' },
    UNPAID:    { bg: 'bg-amber-50 text-amber-700 ring-amber-200',        dot: 'bg-amber-400',   label: 'Pending' },
    CANCELLED: { bg: 'bg-red-50 text-red-600 ring-red-200',              dot: 'bg-red-500',     label: 'Cancelled' },
    REFUNDED:  { bg: 'bg-slate-50 text-slate-500 ring-slate-200',        dot: 'bg-slate-400',   label: 'Refunded' },
  };
  const c = cfg[status] ?? cfg.UNPAID;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest ring-1 ${c.bg} print:hidden`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
};

// ── main component ───────────────────────────────────────────────────────────
const InvoiceComp = () => {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { invoice, isLoading } = useFetchInvoice(id);
  const { invoiceSettings } = useFetchInvoiceSettings();

  const autoprint = searchParams.get('autoprint') === '1';
  const hasAutoprinted = useRef(false);

  useEffect(() => {
    if (!autoprint || hasAutoprinted.current || !invoice) return;
    hasAutoprinted.current = true;
    const timer = setTimeout(() => window.print(), 300);
    return () => clearTimeout(timer);
  }, [autoprint, invoice]);

  const pageSize =
    invoiceSettings?.invoicePaperSize === 'CUSTOM' &&
    invoiceSettings.invoicePaperWidthMm &&
    invoiceSettings.invoicePaperHeightMm
      ? `${invoiceSettings.invoicePaperWidthMm}mm ${invoiceSettings.invoicePaperHeightMm}mm`
      : invoiceSettings?.invoicePaperSize === 'LETTER'
        ? 'letter'
        : 'A4';

  const [downloading, setDownloading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const axiosSecure = useAxiosSecure();

  if (isLoading) {
    return <FullScreenCenter><LoadingDots /></FullScreenCenter>;
  }

  if (!invoice) {
    return (
      <FullScreenCenter>
        <div className="text-center">
          <p className="text-2xl mb-2">🪑</p>
          <p className="text-sm text-gray-500">Invoice not found.</p>
        </div>
      </FullScreenCenter>
    );
  }

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await axiosSecure.get(`/invoices/${invoice.id}/pdf`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(
        new Blob([res.data], { type: 'application/pdf' }),
      );
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.invoiceNo}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download invoice');
    } finally {
      setDownloading(false);
    }
  };

  const items: OrderItem[] = invoice.order?.items ?? [];
  const subtotal = items.reduce(
    (s: number, i: OrderItem) => s + Number(i.totalPriceAtPurchase), 0,
  );
  const discount = invoice.order.discount ?? 0;
  const delivery = invoice.order.deliveryCharge ?? 0;

  return (
    <>
      {/* ── Google Fonts ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=DM+Mono:wght@400;500&display=swap');

        .inv-font { font-family: 'Cormorant Garamond', Georgia, serif; }
        .inv-mono  { font-family: 'DM Mono', 'Courier New', monospace; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .inv-card { animation: fadeUp .45s ease both; }

        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .inv-card {
            box-shadow: none !important;
            animation: none !important;
            border-radius: 0 !important;
          }
          @page { size: ${pageSize}; }
        }
      `}</style>

      {/* ── Page shell ── */}
      <div className="min-h-screen bg-[#f5f3ef] py-12 px-4 print:bg-white print:py-0">

        {/* ── Action bar ── */}
        <div className="max-w-185 mx-auto mb-5 flex items-center justify-between no-print">
          <div>
            <p className="inv-font text-xl font-light text-slate-800 tracking-wide">Tax Invoice</p>
            <p className="inv-mono text-xs text-slate-400 mt-0.5">{invoice.invoiceNo}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="cursor-pointer flex items-center gap-2 px-5 py-2 text-xs font-bold tracking-widest uppercase border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-all"
            >
              <PrintIcon />
              Print
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="cursor-pointer flex items-center gap-2 px-5 py-2 text-xs font-bold tracking-widest uppercase bg-[#0f172a] text-[#e2c97e] rounded-lg hover:bg-[#1e293b] transition-all disabled:opacity-50"
            >
              <DownloadIcon />
              {downloading ? 'Preparing…' : 'Download PDF'}
            </button>
          </div>
        </div>

        {/* ── Invoice card ── */}
        <div
          ref={printRef}
          className="inv-card max-w-[740px] mx-auto bg-white rounded-2xl shadow-[0_4px_40px_rgba(0,0,0,0.08)] overflow-hidden"
        >

          {/* ── Header ── */}
          <div className="bg-[#0f172a] px-10 py-9 flex justify-between items-start">
            <div>
              <p className="inv-font text-[#e2c97e] text-2xl tracking-[0.25em] uppercase font-semibold">
                Ondorkotha
              </p>
              <p className="text-slate-500 text-[10px] tracking-[0.2em] uppercase mt-1">
                Furniture · Crafted for your home
              </p>
              <div className="mt-5 text-slate-500 text-[11px] leading-relaxed">
                <p>Dhaka, Bangladesh</p>
                <p>support@ondorkotha.com.bd</p>
                <p>ondorkotha.com</p>
              </div>
            </div>

            <div className="text-right">
              <p className="inv-font text-slate-300 text-[32px] font-light tracking-[0.3em] uppercase">
                Invoice
              </p>
              <p className="inv-mono text-[#e2c97e] text-xs mt-1">{invoice.invoiceNo}</p>
              <div className="mt-3">
                <StatusPill status={invoice.order.status ?? 'UNPAID'} />
                {/* Print fallback */}
                <p className="hidden print:block inv-mono text-[10px] text-slate-400 uppercase tracking-widest mt-2">
                  {invoice.order.status ?? 'UNPAID'}
                </p>
              </div>
            </div>
          </div>

          {/* ── Decorative rule ── */}
          <div className="h-[3px] bg-linear-to-r from-[#e2c97e] via-[#c9a84c] to-[#0f172a]" />

          {/* ── Meta row ── */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
            <MetaBlock label="Billed To">
              <p className="inv-font text-base font-semibold text-slate-900 leading-tight">
                {invoice.order.customerName}
              </p>
              {invoice.order.customerEmail && (
                <p className="text-slate-500 text-[11px] mt-1">{invoice.order.customerEmail}</p>
              )}
              {invoice.order.customerPhone && (
                <p className="inv-mono text-slate-500 text-[11px]">{invoice.order.customerPhone}</p>
              )}
              {invoice.order.shippingAddress && (
                <p className="text-slate-400 text-[11px] mt-1.5 leading-relaxed">
                  {invoice.order.shippingAddress}
                </p>
              )}
            </MetaBlock>

            <MetaBlock label="Issued">
              <p className="inv-font text-slate-800 text-sm">{formatDate(invoice.issuedAt)}</p>
              {invoice.dueDate && (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 mt-4 mb-1">Due</p>
                  <p className="inv-font text-slate-800 text-sm">{formatDate(invoice.dueDate)}</p>
                </>
              )}
            </MetaBlock>

            <MetaBlock label="Order Ref">
              <p className="inv-mono text-slate-700 text-[11px] break-all">{invoice.order?.id}</p>
              {invoice.paidAt && (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 mt-4 mb-1">Paid On</p>
                  <p className="inv-font text-slate-800 text-sm">{formatDate(invoice.paidAt)}</p>
                </>
              )}
            </MetaBlock>
          </div>

          {/* ── Line items ── */}
          <div className="px-10 pt-8 pb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y-2 border-[#0f172a]">
                  <th className="text-left py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 w-[42%]">
                    Item
                  </th>
                  <th className="text-center py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                    Qty
                  </th>
                  <th className="text-right py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                    Unit Price
                  </th>
                  <th className="text-right py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map((item: OrderItem, idx: number) => (
                  <tr key={item.id ?? idx} className="group">
                    <td className="py-4 pr-4">
                      <p className="inv-font text-[15px] font-semibold text-slate-900 leading-tight">
                        {item.productTitle}
                      </p>
                      {item.sku && (
                        <p className="inv-mono text-[10px] text-slate-400 mt-0.5">
                          SKU: {item.sku}
                        </p>
                      )}
                    </td>
                    <td className="py-4 text-center inv-mono text-slate-500 text-[13px]">
                      {item.quantity}
                    </td>
                    <td className="py-4 text-right inv-mono text-slate-500 text-[13px]">
                      {taka(item.priceAtPurchase)}
                    </td>
                    <td className="py-4 text-right inv-mono font-medium text-slate-900 text-[13px]">
                      {taka(item.totalPriceAtPurchase)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Totals ── */}
          <div className="px-10 pb-10 flex justify-end">
            <div className="w-56 space-y-2 text-[13px]">
              <TotalRow label="Subtotal" value={taka(subtotal)} />
              {discount > 0 && (
                <TotalRow label="Discount" value={`− ${taka(discount)}`} green />
              )}
              <TotalRow
                label="Delivery"
                value={delivery > 0 ? taka(delivery) : 'Free'}
              />
              <div className="pt-3 border-t-2 border-[#0f172a] flex justify-between items-baseline">
                <span className="inv-font text-lg font-semibold text-slate-900">Total</span>
                <span className="inv-mono font-bold text-[16px] text-slate-900">
                  {taka(invoice.total)}
                </span>
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="border-t border-slate-100 bg-[#faf9f7] px-10 py-5 flex justify-between items-center">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Questions? Email us at{' '}
              <span className="text-slate-600">support@ondorkotha.com.bd</span>
              <br />
              Computer-generated invoice — no signature required.
            </p>
            <p className="inv-mono text-[10px] text-slate-300 uppercase tracking-[0.25em]">
              Ondorkotha · {new Date().getFullYear()}
            </p>
          </div>

        </div>

        <p className="text-center inv-font text-slate-400 text-sm mt-8 italic no-print">
          Thank you for choosing Ondorkotha. We hope you love your furniture.
        </p>
      </div>
    </>
  );
};

// ── sub-components ───────────────────────────────────────────────────────────
const MetaBlock = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="px-8 py-6">
    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300 mb-2">
      {label}
    </p>
    {children}
  </div>
);

const TotalRow = ({
  label,
  value,
  green,
}: {
  label: string;
  value: string;
  green?: boolean;
}) => (
  <div className="flex justify-between text-slate-500">
    <span>{label}</span>
    <span className={`inv-mono ${green ? 'text-emerald-600' : ''}`}>{value}</span>
  </div>
);

// ── icons ────────────────────────────────────────────────────────────────────
const PrintIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9"/>
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
    <rect x="6" y="14" width="12" height="8"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

export default InvoiceComp;