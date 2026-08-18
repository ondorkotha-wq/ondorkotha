"use client";

import { useState, useCallback, useRef } from "react";

export interface AttributeCRUD<TForm> {
  editingId: number | null;
  setEditingId: (id: number | null) => void;
  isAdding: boolean;
  setIsAdding: (v: boolean) => void;
  isProcessing: boolean;
  setIsProcessing: (v: boolean) => void;
  deleteId: number | null;
  setDeleteId: (id: number | null) => void;
  formData: TForm;
  setFormData: React.Dispatch<React.SetStateAction<TForm>>;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  resetForm: () => void;
  startAdding: () => void;
}

export function useAttributeCRUD<TForm>(
  defaultForm: TForm,
): AttributeCRUD<TForm> {
  const defaultRef = useRef(defaultForm);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState<TForm>(defaultForm);
  const [searchTerm, setSearchTerm] = useState("");

  const resetForm = useCallback(() => {
    setFormData(defaultRef.current);
    setEditingId(null);
    setIsAdding(false);
  }, []);

  const startAdding = useCallback(() => {
    setFormData(defaultRef.current);
    setEditingId(null);
    setIsAdding(true);
  }, []);

  return {
    editingId,
    setEditingId,
    isAdding,
    setIsAdding,
    isProcessing,
    setIsProcessing,
    deleteId,
    setDeleteId,
    formData,
    setFormData,
    searchTerm,
    setSearchTerm,
    resetForm,
    startAdding,
  };
}
