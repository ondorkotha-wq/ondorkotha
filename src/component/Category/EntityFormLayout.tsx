"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { FiSave } from "react-icons/fi";
import { FullScreenCenter } from "@/component/Screen/FullScreenCenter";
import LoadingDots from "@/component/Loading/LoadingDS";

interface EntityFormLayoutProps {
  title: string;
  description: string;
  backPath: string;
  isLoading: boolean;
  isDataFetching?: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
  submitLabel: string;
  children: React.ReactNode; // For specific fields like Series Dropdown
  previewCard: React.ReactNode;
}

export const EntityFormLayout = ({
  title,
  description,
  backPath,
  isLoading,
  isDataFetching,
  onSubmit,
  onReset,
  submitLabel,
  children,
  previewCard,
}: EntityFormLayoutProps) => {
  const router = useRouter();

  if (isDataFetching) {
    return (
      <FullScreenCenter>
        <LoadingDots />
      </FullScreenCenter>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <p className="text-gray-600 mt-1">{description}</p>
        </div>
        <button
          onClick={() => router.push(backPath)}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          Back
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={onSubmit} className="space-y-8">
          {children}

          {/* Preview Section */}
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Live Preview
            </h3>
            {previewCard}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onReset}
              className="px-6 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              disabled={isLoading}
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FiSave />
              )}
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
