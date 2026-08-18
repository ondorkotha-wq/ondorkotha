"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { Save } from "lucide-react";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import axios from "axios";

export default function PrivacyPolicyAdmin() {
  const axiosSecure = useAxiosSecure();

  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await axiosSecure.get("/company");
      setContent(data.privacyPolicy ?? "");
    } catch {
      toast.error("Failed to load privacy policy");
    } finally {
      setIsLoading(false);
    }
  }, [axiosSecure]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await axiosSecure.patch("/company", { privacyPolicy: content });
      toast.success("Privacy policy saved");
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data as { message?: string })?.message
        : null;
      toast.error(msg ?? "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Privacy Policy
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Shown on /privacy-policy — supports HTML
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          <Save size={16} />
          {isSaving ? "Saving…" : "Save"}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {isLoading ? (
          <div className="py-20 text-center text-sm text-gray-400">
            Loading…
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={"<h2>Privacy Policy</h2>\n<p>We collect…</p>"}
            rows={24}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:border-indigo-400 resize-y"
          />
        )}
      </div>
    </div>
  );
}
