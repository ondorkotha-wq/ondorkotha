"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import useFetchCompany from "@/hooks/Company/useFetchCompany";
import useFetchLabelSizes from "@/hooks/Settings/useFetchLabelSizes";
import { useBarcodeScanInput } from "@/hooks/Barcode/useBarcodeScanInput";
import LabelSheet from "@/component/admin/PrintLabels/LabelSheet";
import { printLabelSheet, PrintRotation } from "@/component/admin/PrintLabels/printLabels";
import { CUSTOM_TEMPLATE_NAME } from "@/component/admin/PrintLabels/LabelTemplates";
import {
  DEFAULT_LABEL_CONFIG,
  LabelFieldConfig,
  LabelRow,
} from "@/component/admin/PrintLabels/types";
import {
  BatchReconciliation,
  GeneratePiecesResult,
  OpenGenerationBatch,
  Piece,
  ReceiveOutcome,
  StaleGenerationBatch,
  VoidPiecesResult,
} from "@/types/piece.types";
import { Supplier } from "@/types/supplier.types";
import { InventoryListResponse, InventoryRow } from "@/types/inventory";
import {
  DamageBySupplier,
  DamageByType,
  InventorySummary,
  ShelfMapEntry,
} from "@/types/piece-dashboard.types";

interface WarehouseLocationOption {
  id: string;
  code: string;
  zone?: string;
  aisle?: string;
  shelf?: string;
  bin?: string;
  label?: string | null;
}

type Tab = "generate" | "receive" | "location" | "return" | "reports";

const CONFIG_STORAGE_KEY = "pieceLabelsFieldConfig";
const ROTATION_STORAGE_KEY = "pieceLabelsRotation";

const loadStoredConfig = (): LabelFieldConfig => {
  if (typeof window === "undefined") return DEFAULT_LABEL_CONFIG;
  try {
    const raw = window.localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_LABEL_CONFIG;
    return { ...DEFAULT_LABEL_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_LABEL_CONFIG;
  }
};

const loadStoredRotation = (): PrintRotation => {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(ROTATION_STORAGE_KEY);
  return raw === "90" || raw === "180" || raw === "270"
    ? (Number(raw) as PrintRotation)
    : 0;
};

const fieldLabels: Record<keyof LabelFieldConfig, string> = {
  productName: "Product Name",
  variation: "Product Variation",
  price: "Product Price",
  businessName: "Business Name",
  packingDate: "Packing Date",
  lotNumber: "Lot Number",
};

const pieceToLabelRow = (p: Piece): LabelRow => ({
  barcodeId: String(p.id),
  barcodeValue: p.barcodeValue,
  productTitle: p.productSize.color.product.title,
  variation: [p.productSize.color.color.name, p.productSize.size.name]
    .filter(Boolean)
    .join(" / "),
  price: p.productSize.price ?? p.productSize.basePrice ?? undefined,
  labelQty: 1,
});

export default function PieceInventoryManagement() {
  const axiosSecure = useAxiosSecure();
  const { company } = useFetchCompany();
  const { labelSizes } = useFetchLabelSizes();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("generate");

  // Deep-linked from places like the stale-barcode dashboard widget.
  useEffect(() => {
    const requestedTab = searchParams.get("tab");
    if (
      requestedTab === "generate" ||
      requestedTab === "receive" ||
      requestedTab === "location" ||
      requestedTab === "return" ||
      requestedTab === "reports"
    ) {
      setTab(requestedTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Generate & Print ──────────────────────────────────────────────────────
  const [variantSearch, setVariantSearch] = useState("");
  const [variantResults, setVariantResults] = useState<InventoryRow[]>([]);
  const [searchingVariants, setSearchingVariants] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<InventoryRow | null>(
    null,
  );

  // Deep-linked from the product list ("Barcode" action) — prefill the
  // variant search so the matching row(s) show up ready to pick.
  useEffect(() => {
    const search = searchParams.get("search");
    if (!search) return;
    setTab("generate");
    setVariantSearch(search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [genQuantity, setGenQuantity] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [generatedPieces, setGeneratedPieces] = useState<Piece[]>([]);
  const [generatedBatchId, setGeneratedBatchId] = useState<string | null>(
    null,
  );
  const [printEntries, setPrintEntries] = useState<LabelRow[] | null>(null);

  // ── Pending (CREATED) barcodes for the selected variant — void/cancel ──────
  const [pendingPieces, setPendingPieces] = useState<Piece[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [selectedPending, setSelectedPending] = useState<Set<string>>(
    new Set(),
  );
  const [confirmingVoid, setConfirmingVoid] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [voiding, setVoiding] = useState(false);

  const [labelConfig, setLabelConfig] =
    useState<LabelFieldConfig>(loadStoredConfig);
  const [templateName, setTemplateName] = useState<string | null>(null);
  const [customWidth, setCustomWidth] = useState(50);
  const [customHeight, setCustomHeight] = useState(30);
  const [printRotation, setPrintRotation] =
    useState<PrintRotation>(loadStoredRotation);

  useEffect(() => {
    if (templateName !== null || labelSizes.length === 0) return;
    const def = labelSizes.find((s) => s.isDefault) ?? labelSizes[0];
    setTemplateName(String(def.id));
  }, [labelSizes, templateName]);

  useEffect(() => {
    window.localStorage.setItem(
      CONFIG_STORAGE_KEY,
      JSON.stringify(labelConfig),
    );
  }, [labelConfig]);

  useEffect(() => {
    window.localStorage.setItem(ROTATION_STORAGE_KEY, String(printRotation));
  }, [printRotation]);

  const activeTemplate = useMemo(() => {
    if (templateName === CUSTOM_TEMPLATE_NAME) {
      return { widthMm: customWidth, heightMm: customHeight };
    }
    const found = labelSizes.find((s) => String(s.id) === templateName);
    return found
      ? { widthMm: found.widthMm, heightMm: found.heightMm }
      : { widthMm: customWidth, heightMm: customHeight };
  }, [templateName, labelSizes, customWidth, customHeight]);

  const toggleField = (key: keyof LabelFieldConfig) => {
    setLabelConfig((prev) => ({
      ...prev,
      [key]: { ...prev[key], show: !prev[key].show },
    }));
  };

  const setFieldSize = (key: keyof LabelFieldConfig, sizePt: number) => {
    setLabelConfig((prev) => ({
      ...prev,
      [key]: { ...prev[key], sizePt },
    }));
  };

  const generatedLabelRows = useMemo(
    () => generatedPieces.map(pieceToLabelRow),
    [generatedPieces],
  );

  // Falls back to pending barcodes so the label config/preview is still
  // available when the variant already had pending pieces from an earlier
  // session (nothing generated just now).
  const previewLabelRows = useMemo(
    () =>
      generatedPieces.length > 0
        ? generatedLabelRows
        : pendingPieces.map(pieceToLabelRow),
    [generatedPieces, generatedLabelRows, pendingPieces],
  );

  useEffect(() => {
    const id = setTimeout(async () => {
      if (variantSearch.trim().length < 2) {
        setVariantResults([]);
        return;
      }
      setSearchingVariants(true);
      try {
        const { data } = await axiosSecure.get<InventoryListResponse>(
          "/inventory",
          { params: { search: variantSearch.trim(), take: 8 } },
        );
        setVariantResults(data.items);
      } catch {
        // non-critical
      } finally {
        setSearchingVariants(false);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [variantSearch, axiosSecure]);

  const handleGenerate = async () => {
    if (!selectedVariant) {
      toast.error("Pick a product variant first");
      return;
    }
    if (genQuantity < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }
    setGenerating(true);
    try {
      const { data } = await axiosSecure.post<GeneratePiecesResult>(
        "/pieces/generate",
        {
          productSizeId: selectedVariant.productSizeId,
          quantity: genQuantity,
        },
      );
      setGeneratedPieces(data.pieces);
      setGeneratedBatchId(data.batchId);
      toast.success(`Generated ${data.pieces.length} unique barcodes`);
      fetchPendingPieces(selectedVariant.productSizeId);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? "Failed to generate pieces",
      );
    } finally {
      setGenerating(false);
    }
  };

  const fetchPendingPieces = useCallback(
    async (productSizeId: number) => {
      setLoadingPending(true);
      try {
        const { data } = await axiosSecure.get<Piece[]>("/pieces", {
          params: { productSizeId, status: "CREATED" },
        });
        setPendingPieces(data);
        setSelectedPending(new Set());
      } catch {
        // non-critical
      } finally {
        setLoadingPending(false);
      }
    },
    [axiosSecure],
  );

  useEffect(() => {
    if (!selectedVariant) {
      setPendingPieces([]);
      setSelectedPending(new Set());
      return;
    }
    fetchPendingPieces(selectedVariant.productSizeId);
  }, [selectedVariant, fetchPendingPieces]);

  const togglePendingSelection = (barcodeValue: string) => {
    setSelectedPending((prev) => {
      const next = new Set(prev);
      if (next.has(barcodeValue)) next.delete(barcodeValue);
      else next.add(barcodeValue);
      return next;
    });
  };

  const handlePrintPending = () => {
    const toPrint = pendingPieces.filter((p) =>
      selectedPending.has(p.barcodeValue),
    );
    if (!toPrint.length) return;
    setPrintEntries(toPrint.map(pieceToLabelRow));
    setTimeout(() => {
      printLabelSheet(
        activeTemplate.widthMm,
        activeTemplate.heightMm,
        printRotation,
      );
    }, 150);
  };

  const handleVoidSelected = async () => {
    if (selectedPending.size === 0) return;
    setVoiding(true);
    try {
      const { data } = await axiosSecure.post<VoidPiecesResult>(
        "/pieces/void",
        {
          barcodeValues: Array.from(selectedPending),
          reasonNote: voidReason.trim() || undefined,
        },
      );
      if (data.succeeded.length > 0) {
        toast.success(`Voided ${data.succeeded.length} barcode(s)`);
      }
      if (data.failed.length > 0) {
        toast.error(`${data.failed.length} barcode(s) could not be voided`);
      }
      setConfirmingVoid(false);
      setVoidReason("");
      if (selectedVariant) fetchPendingPieces(selectedVariant.productSizeId);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to void barcodes");
    } finally {
      setVoiding(false);
    }
  };

  const handlePrint = () => {
    if (!generatedLabelRows.length) return;
    setPrintEntries(generatedLabelRows);
    setTimeout(() => {
      printLabelSheet(
        activeTemplate.widthMm,
        activeTemplate.heightMm,
        printRotation,
      );
    }, 150);
  };

  useEffect(() => {
    if (!printEntries) return;
    const clear = () => setPrintEntries(null);
    window.addEventListener("afterprint", clear);
    return () => window.removeEventListener("afterprint", clear);
  }, [printEntries]);

  // ── Receive ────────────────────────────────────────────────────────────────
  const [receiveInput, setReceiveInput] = useState("");
  const [lookupPiece, setLookupPiece] = useState<Piece | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [processingReceive, setProcessingReceive] = useState(false);
  const [receivedThisSession, setReceivedThisSession] = useState<Piece[]>([]);
  const [batchReconciliation, setBatchReconciliation] =
    useState<BatchReconciliation | null>(null);

  useEffect(() => {
    axiosSecure
      .get<Supplier[]>("/suppliers", { params: { activeOnly: true } })
      .then(({ data }) => setSuppliers(data))
      .catch(() => {});
  }, [axiosSecure]);

  const doReceiveLookup = useCallback(
    async (barcodeValue: string) => {
      setLookupError(null);
      setLookupPiece(null);
      try {
        const { data } = await axiosSecure.post<Piece>(
          "/pieces/receive/lookup",
          { barcodeValue },
        );
        setLookupPiece(data);
      } catch (err: any) {
        setLookupError(
          err?.response?.data?.message ?? `No piece found for ${barcodeValue}`,
        );
      }
    },
    [axiosSecure],
  );

  const { simulateManualEntry } = useBarcodeScanInput({
    enabled: tab === "receive",
    onScan: (value) => {
      setReceiveInput(value);
      doReceiveLookup(value);
    },
  });

  const confirmReceive = async (outcome: ReceiveOutcome) => {
    if (!lookupPiece) return;
    setProcessingReceive(true);
    try {
      const { data } = await axiosSecure.post<Piece>("/pieces/receive", {
        barcodeValue: lookupPiece.barcodeValue,
        supplierId: supplierId || undefined,
        outcome,
      });
      setReceivedThisSession((prev) => [data, ...prev]);
      toast.success(
        outcome === "GOOD"
          ? `${lookupPiece.barcodeValue} marked In Stock`
          : `${lookupPiece.barcodeValue} marked Damaged`,
      );
      if (data.generateBatchId) {
        axiosSecure
          .get<BatchReconciliation>(
            `/pieces/generation-batches/${data.generateBatchId}`,
          )
          .then(({ data: rec }) => setBatchReconciliation(rec))
          .catch(() => {});
      } else {
        setBatchReconciliation(null);
      }
      setLookupPiece(null);
      setReceiveInput("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to receive piece");
    } finally {
      setProcessingReceive(false);
    }
  };

  // ── Assign Location ──────────────────────────────────────────────────────
  const [locationInput, setLocationInput] = useState("");
  const [locationPiece, setLocationPiece] = useState<Piece | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locations, setLocations] = useState<WarehouseLocationOption[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [assigningLocation, setAssigningLocation] = useState(false);
  const [showLocForm, setShowLocForm] = useState(false);
  const [creatingLocation, setCreatingLocation] = useState(false);
  const [locForm, setLocForm] = useState({
    zone: "",
    aisle: "",
    shelf: "",
    bin: "",
    label: "",
  });

  const loadLocations = useCallback(() => {
    axiosSecure
      .get<WarehouseLocationOption[]>("/barcodes/locations")
      .then(({ data }) => setLocations(data))
      .catch(() => {});
  }, [axiosSecure]);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  const createLocation = async () => {
    if (!locForm.zone || !locForm.aisle || !locForm.shelf || !locForm.bin) {
      toast.error("Zone, aisle, shelf and bin are all required");
      return;
    }
    setCreatingLocation(true);
    try {
      await axiosSecure.post("/barcodes/locations", locForm);
      setLocForm({ zone: "", aisle: "", shelf: "", bin: "", label: "" });
      setShowLocForm(false);
      loadLocations();
      toast.success("Location created");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? "Failed to create location",
      );
    } finally {
      setCreatingLocation(false);
    }
  };

  const doLocationLookup = useCallback(
    async (barcodeValue: string) => {
      setLocationError(null);
      setLocationPiece(null);
      try {
        const { data } = await axiosSecure.get<Piece>(
          `/pieces/by-code/${encodeURIComponent(barcodeValue)}`,
        );
        setLocationPiece(data);
      } catch (err: any) {
        setLocationError(
          err?.response?.data?.message ?? `No piece found for ${barcodeValue}`,
        );
      }
    },
    [axiosSecure],
  );

  useBarcodeScanInput({
    enabled: tab === "location",
    onScan: (value) => {
      setLocationInput(value);
      doLocationLookup(value);
    },
  });

  const confirmLocation = async () => {
    if (!locationPiece || !selectedLocationId) return;
    setAssigningLocation(true);
    try {
      await axiosSecure.post(
        `/pieces/${encodeURIComponent(locationPiece.barcodeValue)}/location`,
        { locationId: selectedLocationId },
      );
      toast.success(`${locationPiece.barcodeValue} shelved`);
      setLocationPiece(null);
      setLocationInput("");
      setSelectedLocationId("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to assign location");
    } finally {
      setAssigningLocation(false);
    }
  };

  // ── Process Return ────────────────────────────────────────────────────────
  const [returnInput, setReturnInput] = useState("");
  const [returnPiece, setReturnPiece] = useState<Piece | null>(null);
  const [returnError, setReturnError] = useState<string | null>(null);
  const [processingReturn, setProcessingReturn] = useState(false);
  const [returnedThisSession, setReturnedThisSession] = useState<Piece[]>([]);

  const doReturnLookup = useCallback(
    async (barcodeValue: string) => {
      setReturnError(null);
      setReturnPiece(null);
      try {
        const { data } = await axiosSecure.post<Piece>("/pieces/return/lookup", {
          barcodeValue,
        });
        setReturnPiece(data);
      } catch (err: any) {
        setReturnError(
          err?.response?.data?.message ?? `No piece found for ${barcodeValue}`,
        );
      }
    },
    [axiosSecure],
  );

  const { simulateManualEntry: simulateReturnEntry } = useBarcodeScanInput({
    enabled: tab === "return",
    onScan: (value) => {
      setReturnInput(value);
      doReturnLookup(value);
    },
  });

  const confirmReturn = async (outcome: ReceiveOutcome) => {
    if (!returnPiece) return;
    setProcessingReturn(true);
    try {
      const { data } = await axiosSecure.post<Piece>("/pieces/return/receive", {
        barcodeValue: returnPiece.barcodeValue,
        outcome,
      });
      setReturnedThisSession((prev) => [data, ...prev]);
      toast.success(
        outcome === "GOOD"
          ? `${returnPiece.barcodeValue} back in stock`
          : `${returnPiece.barcodeValue} marked damaged`,
      );
      setReturnPiece(null);
      setReturnInput("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to process return");
    } finally {
      setProcessingReturn(false);
    }
  };

  // ── Reports ──────────────────────────────────────────────────────────────
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [shelfMap, setShelfMap] = useState<ShelfMapEntry[]>([]);
  const [damageBySupplier, setDamageBySupplier] = useState<DamageBySupplier[]>(
    [],
  );
  const [damageByType, setDamageByType] = useState<DamageByType | null>(null);
  const [damageGroupBy, setDamageGroupBy] = useState<"supplier" | "type">(
    "supplier",
  );
  const [openBatches, setOpenBatches] = useState<OpenGenerationBatch[]>([]);
  const [staleBatchIds, setStaleBatchIds] = useState<Set<string>>(new Set());
  const [loadingReports, setLoadingReports] = useState(false);

  const refreshOpenBatches = useCallback(() => {
    return axiosSecure
      .get<OpenGenerationBatch[]>("/pieces/generation-batches")
      .then(({ data }) => setOpenBatches(data));
  }, [axiosSecure]);

  const refreshStaleBatches = useCallback(() => {
    return axiosSecure
      .get<StaleGenerationBatch[]>("/pieces/stale")
      .then(({ data }) => setStaleBatchIds(new Set(data.map((b) => b.batchId))));
  }, [axiosSecure]);

  const loadDamageReport = useCallback(
    (groupBy: "supplier" | "type") => {
      if (groupBy === "supplier") {
        return axiosSecure
          .get<DamageBySupplier[]>("/pieces/dashboard/damage-report", {
            params: { groupBy: "supplier" },
          })
          .then(({ data }) => setDamageBySupplier(data));
      }
      return axiosSecure
        .get<DamageByType>("/pieces/dashboard/damage-report", {
          params: { groupBy: "type" },
        })
        .then(({ data }) => setDamageByType(data));
    },
    [axiosSecure],
  );

  const handleDamageGroupByChange = (groupBy: "supplier" | "type") => {
    setDamageGroupBy(groupBy);
    loadDamageReport(groupBy);
  };

  useEffect(() => {
    if (tab !== "reports") return;
    setLoadingReports(true);
    Promise.all([
      axiosSecure.get<InventorySummary>("/pieces/dashboard/inventory-summary"),
      axiosSecure.get<ShelfMapEntry[]>("/pieces/dashboard/shelf-map"),
      loadDamageReport("supplier"),
      refreshOpenBatches(),
      refreshStaleBatches(),
    ])
      .then(([s, m]) => {
        setSummary(s.data);
        setShelfMap(m.data.filter((l) => l.pieceCount > 0));
      })
      .catch(() => toast.error("Failed to load reports"))
      .finally(() => setLoadingReports(false));
  }, [tab, axiosSecure, refreshOpenBatches, refreshStaleBatches, loadDamageReport]);

  const [voidingBatchId, setVoidingBatchId] = useState<string | null>(null);

  const handleVoidBatchPending = async (batch: OpenGenerationBatch) => {
    setVoidingBatchId(batch.batchId);
    try {
      const { data: pending } = await axiosSecure.get<Piece[]>("/pieces", {
        params: { productSizeId: batch.productSizeId, status: "CREATED" },
      });
      const barcodeValues = pending
        .filter((p) => p.generateBatchId === batch.batchId)
        .map((p) => p.barcodeValue);
      if (barcodeValues.length === 0) {
        toast.error("Nothing left to void for this batch");
        return;
      }
      const { data } = await axiosSecure.post<VoidPiecesResult>(
        "/pieces/void",
        { barcodeValues, reasonNote: "Voided remaining pending from batch" },
      );
      toast.success(`Voided ${data.succeeded.length} barcode(s)`);
      refreshOpenBatches();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to void batch");
    } finally {
      setVoidingBatchId(null);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Piece Barcodes
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Every physical unit gets its own unique barcode — generate, receive,
          and shelve them here.
        </p>
      </div>

      <div className="flex gap-6 border-b border-gray-200 print:hidden">
        {(
          [
            { key: "generate", label: "Generate & Print" },
            { key: "receive", label: "Receive" },
            { key: "location", label: "Assign Location" },
            { key: "return", label: "Process Return" },
            { key: "reports", label: "Reports" },
          ] as { key: Tab; label: string }[]
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Generate & Print ── */}
      {tab === "generate" && (
        <div className="space-y-5 print:hidden">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div className="relative">
              <input
                value={variantSearch}
                onChange={(e) => {
                  setVariantSearch(e.target.value);
                  setSelectedVariant(null);
                }}
                placeholder="Search product to generate piece barcodes for…"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
              />
              {variantSearch.length >= 2 && !selectedVariant && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {searchingVariants ? (
                    <p className="px-4 py-3 text-xs text-gray-400">
                      Searching…
                    </p>
                  ) : variantResults.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-gray-400">
                      No matching variants.
                    </p>
                  ) : (
                    variantResults.map((r) => (
                      <button
                        key={r.productSizeId}
                        onClick={() => {
                          setSelectedVariant(r);
                          setVariantSearch(
                            `${r.product.title} — ${r.color} / ${r.size}`,
                          );
                          setGeneratedPieces([]);
                        }}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-gray-50"
                      >
                        <span>
                          {r.product.title}{" "}
                          <span className="text-gray-400">
                            ({r.color} / {r.size})
                          </span>
                        </span>
                        <span className="text-xs text-gray-400">
                          qty {r.quantity}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {selectedVariant && (
              <div className="flex items-end gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                    Quantity (pieces to generate)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={genQuantity}
                    onChange={(e) =>
                      setGenQuantity(Math.max(1, Number(e.target.value)))
                    }
                    className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {generating ? "Generating…" : "Generate Pieces"}
                </button>
              </div>
            )}

            {generatedPieces.length > 0 && (
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {generatedPieces.length} barcodes generated
                    </p>
                    {generatedBatchId && (
                      <p className="text-[11px] text-gray-400 font-mono">
                        Batch {generatedBatchId}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handlePrint}
                    className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Print Stickers
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                  {generatedPieces.map((p) => (
                    <span
                      key={p.id}
                      className="text-[11px] font-mono bg-gray-50 border border-gray-100 rounded px-2 py-1"
                    >
                      {p.barcodeValue}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Pending (unreceived) barcodes — void/cancel overprints ── */}
          {selectedVariant && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-900">
                  Pending barcodes for this variant
                </p>
                <span className="text-xs text-gray-400">
                  {loadingPending
                    ? "Loading…"
                    : `${pendingPieces.length} awaiting receipt`}
                </span>
              </div>
              {pendingPieces.length === 0 ? (
                <p className="text-xs text-gray-400">
                  No unreceived barcodes for this variant.
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto mb-3">
                    {pendingPieces.map((p) => (
                      <label
                        key={p.id}
                        className={`flex items-center gap-1.5 text-[11px] font-mono border rounded px-2 py-1 cursor-pointer ${
                          selectedPending.has(p.barcodeValue)
                            ? "bg-red-50 border-red-200 text-red-700"
                            : "bg-gray-50 border-gray-100"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="accent-red-500 w-3.5 h-3.5"
                          checked={selectedPending.has(p.barcodeValue)}
                          onChange={() =>
                            togglePendingSelection(p.barcodeValue)
                          }
                        />
                        {p.barcodeValue}
                      </label>
                    ))}
                  </div>

                  {!confirmingVoid ? (
                    <div className="flex gap-2">
                      <button
                        onClick={handlePrintPending}
                        disabled={selectedPending.size === 0}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Print selected ({selectedPending.size})
                      </button>
                      <button
                        onClick={() => setConfirmingVoid(true)}
                        disabled={selectedPending.size === 0}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Void selected ({selectedPending.size})
                      </button>
                    </div>
                  ) : (
                    <div className="border border-red-200 bg-red-50/60 rounded-lg p-3 space-y-2">
                      <p className="text-xs text-red-800 font-medium">
                        Void {selectedPending.size} barcode(s)? They will never
                        be receivable again — this doesn&apos;t affect stock
                        since these were never counted as in-stock.
                      </p>
                      <input
                        value={voidReason}
                        onChange={(e) => setVoidReason(e.target.value)}
                        placeholder="Reason (optional) — e.g. overprinted, shipment short"
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-indigo-400"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleVoidSelected}
                          disabled={voiding}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {voiding ? "Voiding…" : "Confirm void"}
                        </button>
                        <button
                          onClick={() => setConfirmingVoid(false)}
                          disabled={voiding}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Label field config + size + preview ── */}
          {(generatedPieces.length > 0 || pendingPieces.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-sm font-semibold text-gray-900 mb-3">
                  Information to show in Labels
                </p>
                <div className="space-y-3">
                  {(
                    Object.keys(fieldLabels) as (keyof LabelFieldConfig)[]
                  ).map((key) => (
                    <div key={key} className="flex items-center gap-3">
                      <label className="flex items-center gap-2 flex-1 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={labelConfig[key].show}
                          onChange={() => toggleField(key)}
                          className="accent-indigo-600 w-4 h-4"
                        />
                        {fieldLabels[key]}
                      </label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-gray-400 uppercase">
                          Size
                        </span>
                        <input
                          type="number"
                          min={5}
                          max={24}
                          value={labelConfig[key].sizePt}
                          onChange={(e) =>
                            setFieldSize(key, Number(e.target.value))
                          }
                          className="w-16 px-2 py-1 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-indigo-400"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 pt-5 border-t border-gray-100">
                  <p className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                    Sticker size
                  </p>
                  <select
                    value={templateName ?? ""}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-indigo-400"
                  >
                    {labelSizes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                        {s.isDefault ? " (default)" : ""}
                      </option>
                    ))}
                    <option value={CUSTOM_TEMPLATE_NAME}>Custom</option>
                  </select>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Manage saved sizes under Settings → Barcode & Label
                    Settings.
                  </p>

                  {templateName === CUSTOM_TEMPLATE_NAME && (
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="text-[10px] text-gray-400 uppercase block mb-1">
                          Width (mm)
                        </label>
                        <input
                          type="number"
                          min={10}
                          value={customWidth}
                          onChange={(e) =>
                            setCustomWidth(Number(e.target.value))
                          }
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-indigo-400"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 uppercase block mb-1">
                          Height (mm)
                        </label>
                        <input
                          type="number"
                          min={10}
                          value={customHeight}
                          onChange={(e) =>
                            setCustomHeight(Number(e.target.value))
                          }
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-indigo-400"
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-3">
                    <label className="text-[10px] text-gray-400 uppercase block mb-1">
                      Rotate printed label
                    </label>
                    <select
                      value={printRotation}
                      onChange={(e) =>
                        setPrintRotation(
                          Number(e.target.value) as PrintRotation,
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-indigo-400"
                    >
                      <option value={0}>0° (no rotation)</option>
                      <option value={90}>90°</option>
                      <option value={180}>180°</option>
                      <option value={270}>270°</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-sm font-semibold text-gray-900 mb-3">
                  Preview
                </p>
                <div className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-105">
                  <LabelSheet
                    entries={previewLabelRows}
                    config={labelConfig}
                    widthMm={activeTemplate.widthMm}
                    heightMm={activeTemplate.heightMm}
                    businessName={company?.name}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Receive ── */}
      {tab === "receive" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 print:hidden">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <p className="text-sm font-semibold text-gray-900">
              Scan or type a barcode to receive it
            </p>
            <div className="flex gap-2">
              <input
                value={receiveInput}
                onChange={(e) => setReceiveInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") simulateManualEntry(receiveInput);
                }}
                placeholder="PC-00000001"
                className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:border-indigo-400"
              />
              <button
                onClick={() => simulateManualEntry(receiveInput)}
                className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Look up
              </button>
            </div>

            {lookupError && (
              <p className="text-sm text-red-600">{lookupError}</p>
            )}

            {lookupPiece && (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 p-4 space-y-3">
                <div>
                  <p className="font-medium text-gray-900">
                    {lookupPiece.productSize.color.product.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {lookupPiece.productSize.color.color.name} /{" "}
                    {lookupPiece.productSize.size.name} — {lookupPiece.barcodeValue}
                  </p>
                </div>

                <select
                  value={supplierId}
                  onChange={(e) =>
                    setSupplierId(e.target.value ? Number(e.target.value) : "")
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-indigo-400"
                >
                  <option value="">Select supplier (optional)</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>

                <div className="flex gap-2">
                  <button
                    onClick={() => confirmReceive("GOOD")}
                    disabled={processingReceive}
                    className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Good — In Stock
                  </button>
                  <button
                    onClick={() => confirmReceive("DAMAGED")}
                    disabled={processingReceive}
                    className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Damaged
                  </button>
                </div>
              </div>
            )}
          </div>

          {batchReconciliation && (
            <div className="border border-indigo-200 bg-indigo-50/60 rounded-lg p-3 lg:col-span-2">
              <p className="text-xs text-indigo-800">
                Batch <span className="font-mono">{batchReconciliation.batchId}</span>
                : <span className="font-semibold">
                  {batchReconciliation.received}/{batchReconciliation.quantity}
                </span>{" "}
                received
                {batchReconciliation.voided > 0
                  ? ` · ${batchReconciliation.voided} voided`
                  : ""}
                {batchReconciliation.pending > 0
                  ? ` · ${batchReconciliation.pending} still pending`
                  : " · fully reconciled"}
              </p>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm font-semibold text-gray-900 mb-3">
              Received this session ({receivedThisSession.length})
            </p>
            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {receivedThisSession.length === 0 ? (
                <p className="text-xs text-gray-400">Nothing yet.</p>
              ) : (
                receivedThisSession.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50"
                  >
                    <span className="font-mono text-xs">{p.barcodeValue}</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.status === "IN_STOCK"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Assign Location ── */}
      {tab === "location" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 print:hidden">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <p className="text-sm font-semibold text-gray-900">
              Scan or type a barcode to shelve it
            </p>
            <div className="flex gap-2">
              <input
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") doLocationLookup(locationInput);
                }}
                placeholder="PC-00000001"
                className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:border-indigo-400"
              />
              <button
                onClick={() => doLocationLookup(locationInput)}
                className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Look up
              </button>
            </div>

            {locationError && (
              <p className="text-sm text-red-600">{locationError}</p>
            )}

            {locationPiece && (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 p-4 space-y-3">
                <div>
                  <p className="font-medium text-gray-900">
                    {locationPiece.productSize.color.product.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {locationPiece.productSize.color.color.name} /{" "}
                    {locationPiece.productSize.size.name} — status:{" "}
                    {locationPiece.status}
                  </p>
                </div>

                {locationPiece.status !== "IN_STOCK" ? (
                  <p className="text-sm text-red-600">
                    Only in-stock pieces can be shelved.
                  </p>
                ) : (
                  <>
                    <select
                      value={selectedLocationId}
                      onChange={(e) => setSelectedLocationId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-indigo-400"
                    >
                      <option value="">Select shelf location</option>
                      {locations.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.code} {l.label ? `— ${l.label}` : ""}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={confirmLocation}
                      disabled={!selectedLocationId || assigningLocation}
                      className="w-full px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      {assigningLocation ? "Assigning…" : "Assign Location"}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── Warehouse locations: browse + create ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-900">
                Warehouse Locations ({locations.length})
              </p>
              <button
                onClick={() => setShowLocForm(!showLocForm)}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {showLocForm ? "Cancel" : "+ Add Location"}
              </button>
            </div>

            {showLocForm && (
              <div className="border border-gray-100 rounded-xl p-4 mb-4 bg-gray-50/60 space-y-3">
                <div className="grid grid-cols-4 gap-2">
                  {(["zone", "aisle", "shelf", "bin"] as const).map((f) => (
                    <div key={f}>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                        {f}
                      </label>
                      <input
                        value={locForm[f]}
                        onChange={(e) =>
                          setLocForm((p) => ({ ...p, [f]: e.target.value }))
                        }
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
                        placeholder={
                          f === "zone"
                            ? "A"
                            : f === "aisle"
                              ? "3"
                              : f === "shelf"
                                ? "B"
                                : "02"
                        }
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                    Label (optional)
                  </label>
                  <input
                    value={locForm.label}
                    onChange={(e) =>
                      setLocForm((p) => ({ ...p, label: e.target.value }))
                    }
                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
                    placeholder="Dining North"
                  />
                </div>
                <button
                  onClick={createLocation}
                  disabled={creatingLocation}
                  className="px-4 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {creatingLocation ? "Creating…" : "Create Location"}
                </button>
              </div>
            )}

            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {locations.length === 0 ? (
                <p className="text-xs text-gray-400">No locations yet.</p>
              ) : (
                locations.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50"
                  >
                    <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                      {l.code}
                    </span>
                    {l.label && (
                      <span className="text-xs text-gray-400 italic">
                        {l.label}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Process Return ── */}
      {tab === "return" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 print:hidden">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <p className="text-sm font-semibold text-gray-900">
              Scan or type a returned barcode
            </p>
            <div className="flex gap-2">
              <input
                value={returnInput}
                onChange={(e) => setReturnInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") simulateReturnEntry(returnInput);
                }}
                placeholder="PC-00000001"
                className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:border-indigo-400"
              />
              <button
                onClick={() => simulateReturnEntry(returnInput)}
                className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Look up
              </button>
            </div>

            {returnError && (
              <p className="text-sm text-red-600">{returnError}</p>
            )}

            {returnPiece && (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 p-4 space-y-3">
                <div>
                  <p className="font-medium text-gray-900">
                    {returnPiece.productSize.color.product.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {returnPiece.productSize.color.color.name} /{" "}
                    {returnPiece.productSize.size.name} —{" "}
                    {returnPiece.barcodeValue}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => confirmReturn("GOOD")}
                    disabled={processingReturn}
                    className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Good — Back to Stock
                  </button>
                  <button
                    onClick={() => confirmReturn("DAMAGED")}
                    disabled={processingReturn}
                    className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Damaged
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm font-semibold text-gray-900 mb-3">
              Processed this session ({returnedThisSession.length})
            </p>
            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {returnedThisSession.length === 0 ? (
                <p className="text-xs text-gray-400">Nothing yet.</p>
              ) : (
                returnedThisSession.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50"
                  >
                    <span className="font-mono text-xs">{p.barcodeValue}</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.status === "RETURNED_IN_STOCK"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Reports ── */}
      {tab === "reports" && (
        <div className="space-y-5 print:hidden">
          {loadingReports ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : (
            <>
              {summary && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <p className="text-sm font-semibold text-gray-900 mb-3">
                    Pieces by status
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {(Object.keys(summary) as (keyof InventorySummary)[]).map(
                      (status) => (
                        <div
                          key={status}
                          className="rounded-lg border border-gray-100 p-3 text-center"
                        >
                          <p className="text-lg font-bold text-gray-900">
                            {summary[status]}
                          </p>
                          <p className="text-[10px] uppercase tracking-wide text-gray-400 mt-0.5">
                            {status.replace(/_/g, " ")}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-sm font-semibold text-gray-900 mb-3">
                  Open batches ({openBatches.length} with barcodes still
                  pending)
                </p>
                {openBatches.length === 0 ? (
                  <p className="text-xs text-gray-400">
                    Every generated batch has been fully received or voided.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                          <th className="py-2 pr-3">Variant</th>
                          <th className="py-2 pr-3">Batch</th>
                          <th className="py-2 pr-3 text-right">Requested</th>
                          <th className="py-2 pr-3 text-right">Received</th>
                          <th className="py-2 pr-3 text-right">Pending</th>
                          <th className="py-2 pr-3 text-right">Voided</th>
                          <th className="py-2 pr-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {openBatches.map((b) => (
                          <tr
                            key={b.batchId}
                            className="border-b border-gray-50 last:border-0"
                          >
                            <td className="py-2 pr-3">
                              {b.productTitle}{" "}
                              <span className="text-gray-400">
                                ({b.color} / {b.size})
                              </span>
                              {staleBatchIds.has(b.batchId) && (
                                <span className="ml-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                                  Stale
                                </span>
                              )}
                            </td>
                            <td className="py-2 pr-3 font-mono text-[10px] text-gray-400">
                              {b.batchId.slice(0, 8)}…
                            </td>
                            <td className="py-2 pr-3 text-right">
                              {b.quantity}
                            </td>
                            <td className="py-2 pr-3 text-right">
                              {b.received}
                            </td>
                            <td className="py-2 pr-3 text-right font-semibold text-amber-600">
                              {b.pending}
                            </td>
                            <td className="py-2 pr-3 text-right">
                              {b.voided}
                            </td>
                            <td className="py-2 pr-3 text-right">
                              <button
                                onClick={() => handleVoidBatchPending(b)}
                                disabled={voidingBatchId === b.batchId}
                                className="px-2 py-1 text-[11px] font-medium rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-50"
                              >
                                {voidingBatchId === b.batchId
                                  ? "Voiding…"
                                  : `Void remaining (${b.pending})`}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-sm font-semibold text-gray-900 mb-3">
                  Shelf map ({shelfMap.length} occupied location
                  {shelfMap.length === 1 ? "" : "s"})
                </p>
                {shelfMap.length === 0 ? (
                  <p className="text-xs text-gray-400">
                    No pieces currently shelved.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {shelfMap.map((loc) => (
                      <details
                        key={loc.id}
                        className="border border-gray-100 rounded-lg px-3 py-2"
                      >
                        <summary className="flex items-center justify-between text-sm cursor-pointer">
                          <span className="font-medium text-gray-900">
                            {loc.code} {loc.label ? `— ${loc.label}` : ""}
                          </span>
                          <span className="text-xs text-gray-400">
                            {loc.pieceCount} piece{loc.pieceCount === 1 ? "" : "s"}
                          </span>
                        </summary>
                        <div className="mt-2 space-y-1">
                          {loc.pieces.map((p) => (
                            <div
                              key={p.barcodeValue}
                              className="flex items-center justify-between text-xs text-gray-600"
                            >
                              <span className="font-mono">{p.barcodeValue}</span>
                              <span>
                                {p.productTitle} ({p.color}/{p.size})
                              </span>
                            </div>
                          ))}
                        </div>
                      </details>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-900">
                    Damage report
                  </p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDamageGroupByChange("supplier")}
                      className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                        damageGroupBy === "supplier"
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      By Supplier
                    </button>
                    <button
                      onClick={() => handleDamageGroupByChange("type")}
                      className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                        damageGroupBy === "type"
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      By Type
                    </button>
                  </div>
                </div>

                {damageGroupBy === "supplier" ? (
                  damageBySupplier.length === 0 ? (
                    <p className="text-xs text-gray-400">
                      No damaged pieces recorded.
                    </p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-[10px] uppercase text-gray-400 border-b border-gray-100">
                          <th className="py-1.5">Supplier</th>
                          <th className="py-1.5">Damaged Incoming</th>
                          <th className="py-1.5">Damaged Return</th>
                        </tr>
                      </thead>
                      <tbody>
                        {damageBySupplier.map((d) => (
                          <tr
                            key={d.supplierId ?? "unknown"}
                            className="border-b border-gray-50"
                          >
                            <td className="py-1.5">{d.supplierName}</td>
                            <td className="py-1.5">{d.incomingCount}</td>
                            <td className="py-1.5">{d.returnCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )
                ) : damageByType === null ? (
                  <p className="text-xs text-gray-400">Loading…</p>
                ) : damageByType.damagedIncoming === 0 &&
                  damageByType.damagedReturn === 0 ? (
                  <p className="text-xs text-gray-400">
                    No damaged pieces recorded.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-gray-100 p-3 text-center">
                      <p className="text-lg font-bold text-gray-900">
                        {damageByType.damagedIncoming}
                      </p>
                      <p className="text-[10px] uppercase tracking-wide text-gray-400 mt-0.5">
                        Damaged Incoming
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-100 p-3 text-center">
                      <p className="text-lg font-bold text-gray-900">
                        {damageByType.damagedReturn}
                      </p>
                      <p className="text-[10px] uppercase tracking-wide text-gray-400 mt-0.5">
                        Damaged Return
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Hidden print sheet ── */}
      <div className="print-label-sheet fixed -left-2500 -top-2500">
        {printEntries && (
          <LabelSheet
            entries={printEntries}
            config={labelConfig}
            widthMm={activeTemplate.widthMm}
            heightMm={activeTemplate.heightMm}
            businessName={company?.name}
          />
        )}
      </div>
    </div>
  );
}
