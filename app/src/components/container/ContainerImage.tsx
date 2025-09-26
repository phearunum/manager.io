import React, { useEffect, useState } from "react";
import {
  HardDrive,
  Trash,
  Play,
  Tag,
  Info,
  Upload,
  Search,
  ChevronsLeft,
  ChevronsRight,
  Package,
} from "lucide-react";
import { listImages, removeImage } from "@/services/docker.apt";

interface Image {
  id: string;
  repoTags: string[];
  size: number;
  created: number;
}

export const ContainerImageList: React.FC = () => {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const pageSize = 20;

  const fetchImages = async () => {
    setLoading(true);
    try {
      const res = await listImages();
      setImages(res.data);
    } catch (err) {
      console.error("Error fetching images:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  // --- Bulk actions ---
  const handleDelete = async () => {
    if (selected.length === 0) return;
    if (!window.confirm("Are you sure you want to delete selected images?"))
      return;
    try {
      for (const id of selected) {
        await removeImage(id);
      }
      fetchImages();
      setSelected([]);
    } catch (err) {
      console.error("Error deleting images:", err);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleRun = (id: string[]) => console.log("Run images:", selected);
  const handleTag = () => console.log("Tag images:", selected);
  const handleInspect = () => console.log("Inspect images:", selected);
  const handlePush = () => console.log("Push images:", selected);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  // --- Filtering + Pagination ---
  const filteredImages = images.filter((img) => {
    const repoTag = img.repoTags?.[0] || "<none>:<none>";
    return repoTag.toLowerCase().includes(search.toLowerCase());
  });

  const totalPages = Math.ceil(filteredImages.length / pageSize);
  const paginatedImages = filteredImages.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // --- Checkbox helpers ---
  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (paginatedImages.every((img) => selected.includes(img.id))) {
      setSelected((prev) =>
        prev.filter((id) => !paginatedImages.some((img) => img.id === id))
      );
    } else {
      setSelected((prev) => [
        ...prev,
        ...paginatedImages
          .map((img) => img.id)
          .filter((id) => !prev.includes(id)),
      ]);
    }
  };

  return (
    <div className="p-0 mt-5 space-y-3">
      {/* Toolbar: Search + Group Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <HardDrive className="text-blue-600 w-6 h-6" />
          </div>
          <h1
            className="text-2xl font-bold tracking-tight dark:text-gray-100"
            data-testid="text-page-title"
          >
            Images
          </h1>
        </div>

        <div className="relative max-w-md w-full">
          <Search
            size={16}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search by repository or tag..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-8 pr-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 focus:ring focus:ring-blue-500"
          />
        </div>

        {/* Group Button */}
        <div className="inline-flex rounded-md overflow-hidden border border-gray-300">
          <button
            disabled={selected.length === 0}
            onClick={handleTag}
            className="px-3 py-1 border-r border-gray-300 bg-blue-100/50 text-blue-700 hover:bg-blue-600 hover:text-white disabled:opacity-50"
          >
            <Tag size={14} className="inline-block mr-1" /> Tag
          </button>
          <button
            disabled={selected.length === 0}
            onClick={handleInspect}
            className="px-3 py-1 border-r border-gray-300 bg-gray-100/50 text-gray-700 hover:bg-gray-600 hover:text-white disabled:opacity-50"
          >
            <Info size={14} className="inline-block mr-1" /> Inspect
          </button>
          <button
            disabled={selected.length === 0}
            onClick={handlePush}
            className="px-3 py-1 border-r border-gray-300 bg-yellow-100/50 text-yellow-700 hover:bg-yellow-600 hover:text-white disabled:opacity-50"
          >
            <Upload size={14} className="inline-block mr-1" /> Push
          </button>
          <button
            disabled={selected.length === 0}
            onClick={handleDelete}
            className="px-3 py-1 bg-red-100/50 text-red-700 hover:bg-red-600 hover:text-white disabled:opacity-50"
          >
            <Trash size={14} className="inline-block mr-1" /> Delete
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p>Loading images...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow h-[80vh]">
          <table className="min-w-full bg-white dark:bg-gray-800 dark:text-gray-100">
            <thead className="bg-gray-100 dark:bg-gray-700 border-b dark:border-gray-600">
              <tr>
                <th className="px-4 py-2 text-left">
                  <input
                    type="checkbox"
                    checked={
                      paginatedImages.length > 0 &&
                      paginatedImages.every((img) => selected.includes(img.id))
                    }
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-4 py-2 text-left">Repository</th>
                <th className="px-4 py-2 text-left">Tag</th>
                <th className="px-4 py-2 text-left">Image ID</th>
                <th className="px-4 py-2 text-left">Size</th>
                <th className="px-4 py-2 text-left">Created</th>
                <th className="px-4 py-2 text-right">Tools</th>
              </tr>
            </thead>
            <tbody>
              {paginatedImages.map((img) => {
                const repoTag = img.repoTags?.[0] || "<none>:<none>";
                const [repo, tag] = repoTag.split(":");
                return (
                  <tr
                    key={img.id}
                    className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selected.includes(img.id)}
                        onChange={() => toggleSelect(img.id)}
                      />
                    </td>
                    <td className="px-4 py-2 flex items-center gap-2">
                      <HardDrive size={16} className="text-gray-600" />
                      <span>{repo}</span>
                    </td>
                    <td className="px-4 py-2">{tag}</td>
                    <td
                      className="px-4 py-2 truncate max-w-[160px]"
                      title={img.id}
                    >
                      {img.id.substring(7, 19)}
                    </td>
                    <td className="px-4 py-2">{formatSize(img.size)}</td>
                    <td className="px-4 py-2">
                      {new Date(img.created * 1000).toLocaleString("en-GB", {
                        hour12: false,
                      })}
                    </td>
                    <td className="px-4 py-2  text-right">
                      <button
                        onClick={() => handleRun([img.id])} // passing single ID as array
                        className="px-3 py-0 text-sm rounded border border-green-500 bg-green-100/50 text-green-700 hover:bg-green-600 hover:text-white"
                      >
                        <Play size={12} className="inline-block mr-1" /> Run
                      </button>
                    </td>
                  </tr>
                );
              })}
              {paginatedImages.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-4 text-gray-500 dark:text-gray-400"
                  >
                    No images found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-3">
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-2 py-0 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
            >
              <ChevronsLeft />
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-2 py-0 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
            >
              <ChevronsRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContainerImageList;
