"use client";

import React from "react";
import useFetchPaymentMethods, {
  PaymentMethodConfig,
} from "@/hooks/PaymentMethods/useFetchPaymentMethods";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import { Edit3, Save, X, CreditCard } from "lucide-react";
import toast from "react-hot-toast";
import LoadingDots from "@/component/Loading/LoadingDS";
import { FullScreenCenter } from "@/component/Screen/FullScreenCenter";
import { useAttributeCRUD } from "@/hooks/Admin/Attributes/useAttributeCRUD";
import { useHasPermission } from "@/context/PermissionsContext";

interface PaymentMethodFormData {
  displayName: string;
  isEnabled: boolean;
  minAmount: number | null;
  maxAmount: number | null;
  displayOrder: number;
}

const DEFAULT_FORM: PaymentMethodFormData = {
  displayName: "",
  isEnabled: true,
  minAmount: null,
  maxAmount: null,
  displayOrder: 0,
};

const toFormData = (method: PaymentMethodConfig): PaymentMethodFormData => ({
  displayName: method.displayName,
  isEnabled: method.isEnabled,
  minAmount: method.minAmount,
  maxAmount: method.maxAmount,
  displayOrder: method.displayOrder,
});

const getErrorMessage = (error: unknown, fallback: string) => {
  const msg = (error as { response?: { data?: { message?: string } } })
    ?.response?.data?.message;
  return msg || fallback;
};

const PaymentMethodsComp = () => {
  const { paymentMethods, isLoading, refetch } = useFetchPaymentMethods();
  const axiosSecure = useAxiosSecure();
  const canManage = useHasPermission("PAYMENT_METHOD_MANAGE");

  const {
    editingId,
    setEditingId,
    isProcessing,
    setIsProcessing,
    formData,
    setFormData,
    resetForm,
  } = useAttributeCRUD<PaymentMethodFormData>(DEFAULT_FORM);

  const handleEditInit = (method: PaymentMethodConfig) => {
    setEditingId(method.id);
    setFormData(toFormData(method));
  };

  // Quick toggle from the table — no need to enter edit mode just to flip enabled/disabled.
  const handleQuickToggle = async (method: PaymentMethodConfig) => {
    setIsProcessing(true);
    try {
      await axiosSecure.patch(`/payment-methods/${method.id}`, {
        isEnabled: !method.isEnabled,
      });
      toast.success(
        !method.isEnabled
          ? `${method.displayName} enabled`
          : `${method.displayName} disabled`,
      );
      refetch();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to update payment method"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async (id: number) => {
    if (!formData.displayName.trim()) {
      return toast.error("Display name is required");
    }
    if (
      formData.minAmount != null &&
      formData.maxAmount != null &&
      formData.minAmount > formData.maxAmount
    ) {
      return toast.error("Minimum amount cannot exceed maximum amount");
    }

    setIsProcessing(true);
    try {
      await axiosSecure.patch(`/payment-methods/${id}`, formData);
      toast.success("Payment method updated");
      refetch();
      resetForm();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Update failed"));
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <FullScreenCenter>
        <LoadingDots />
      </FullScreenCenter>
    );
  }

  const sorted = [...paymentMethods].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-slate-50/50">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <CreditCard size={22} className="text-indigo-600" /> Payment
          Methods
        </h2>
        <p className="text-sm text-slate-500">
          Enable or disable Cash on Delivery and online payment, and set the
          order-amount range each one accepts. Disabling a method blocks it
          at checkout immediately.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {["Method", "Status", "Min Amount", "Max Amount", "Order", "Actions"].map(
                (h) => (
                  <th
                    key={h}
                    className={`px-6 py-4 font-bold text-slate-500 uppercase tracking-wider ${
                      h === "Actions" ? "text-right" : "text-left"
                    }`}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 bg-white">
            {sorted.map((method) => {
              const isEditing = editingId === method.id;
              return (
                <tr
                  key={method.id}
                  className={`hover:bg-slate-50 transition-colors ${
                    isEditing ? "bg-amber-50/30" : ""
                  }`}
                >
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.displayName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            displayName: e.target.value,
                          })
                        }
                        className="w-full font-semibold border-slate-200 rounded px-2 py-1 border focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    ) : (
                      <div>
                        <span className="font-bold text-slate-800">
                          {method.displayName}
                        </span>
                        <span className="block text-xs text-slate-400 uppercase tracking-wider">
                          {method.method} · {method.gateway}
                        </span>
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {isEditing ? (
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isEnabled}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              isEnabled: e.target.checked,
                            })
                          }
                          className="w-4 h-4 accent-indigo-600"
                        />
                        <span className="text-xs text-slate-600">
                          {formData.isEnabled ? "Enabled" : "Disabled"}
                        </span>
                      </label>
                    ) : (
                      <button
                        disabled={isProcessing || !canManage}
                        onClick={canManage ? () => handleQuickToggle(method) : undefined}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition disabled:opacity-50 ${
                          method.isEnabled
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-red-100 text-red-600 hover:bg-red-200"
                        }`}
                        title={canManage ? "Click to toggle" : undefined}
                      >
                        {method.isEnabled ? "Enabled" : "Disabled"}
                      </button>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {isEditing ? (
                      <input
                        type="number"
                        min={0}
                        placeholder="No minimum"
                        value={formData.minAmount ?? ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            minAmount:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          })
                        }
                        className="w-28 border-slate-200 rounded px-2 py-1 border outline-none"
                      />
                    ) : (
                      <span className="text-slate-700">
                        {method.minAmount != null
                          ? `৳ ${method.minAmount}`
                          : "—"}
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {isEditing ? (
                      <input
                        type="number"
                        min={0}
                        placeholder="No maximum"
                        value={formData.maxAmount ?? ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxAmount:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          })
                        }
                        className="w-28 border-slate-200 rounded px-2 py-1 border outline-none"
                      />
                    ) : (
                      <span className="text-slate-700">
                        {method.maxAmount != null
                          ? `৳ ${method.maxAmount}`
                          : "—"}
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {isEditing ? (
                      <input
                        type="number"
                        value={formData.displayOrder}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            displayOrder: Number(e.target.value),
                          })
                        }
                        className="w-20 border-slate-200 rounded px-2 py-1 border outline-none"
                      />
                    ) : (
                      <span className="text-slate-500">
                        {method.displayOrder}
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSave(method.id)}
                            disabled={isProcessing}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition disabled:opacity-50"
                          >
                            <Save size={18} />
                          </button>
                          <button
                            onClick={resetForm}
                            className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition"
                          >
                            <X size={18} />
                          </button>
                        </>
                      ) : (
                        canManage && (
                          <button
                            onClick={() => handleEditInit(method)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          >
                            <Edit3 size={18} />
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {sorted.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-10 text-center text-slate-400 text-sm"
                >
                  No payment methods configured yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentMethodsComp;
