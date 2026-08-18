/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Tag } from "@/types/product.types";
import useAxiosSecure from "@/hooks/Axios/useAxiosSecure";
import useFetchTags from "@/hooks/Tags/useFetchTags";
import toast from "react-hot-toast";

export const useTagManagement = () => {
  const axiosSecure = useAxiosSecure();
  const { tags, refetch } = useFetchTags();
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredTags = tags.filter((tag: any) =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const tagExists = tags.some(
    (tag: any) => tag.name.toLowerCase() === searchTerm.toLowerCase(),
  );

  const addTag = (tag: Tag) => {
    if (selectedTags.length >= 10 || selectedTags.find((t) => t.id === tag.id))
      return;
    setSelectedTags((prev) => [...prev, tag]);
    setSearchTerm("");
    setShowDropdown(false);
  };

  const removeTag = (id: number) => {
    setSelectedTags((prev) => prev.filter((t) => t.id !== id));
  };

  const handleCreateTag = async () => {
    if (!searchTerm.trim() || selectedTags.length >= 10) return;

    try {
      const res = await axiosSecure.post("tags", {
        name: searchTerm.trim().toLowerCase(),
      });
      await refetch();
      setSelectedTags((prev) => [...prev, res.data]);
      setSearchTerm("");
      setShowDropdown(false);
      toast.success("Tag created");
    } catch (error) {
      toast.error("Failed to create tag");
    }
  };

  const toggleDropdown = () => setShowDropdown((prev) => !prev);

  return {
    selectedTags,
    setSelectedTags,
    searchTerm,
    setSearchTerm,
    showDropdown,
    setShowDropdown,
    filteredTags,
    tagExists,
    addTag,
    removeTag,
    handleCreateTag,
    toggleDropdown,
  };
};