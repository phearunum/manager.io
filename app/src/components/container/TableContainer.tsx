import React, { useState } from "react";

interface Container {
  name: string;
  state: string;
  stack: string;
  image: string;
  created: string;
  ip: string;
  ports: string;
  ownership: string;
}

const containers: Container[] = [
  {
    name: "passbolt-db-1",
    state: "running",
    stack: "passbolt",
    image: "mariadb:10.11",
    created: "2024-03-13 16:29:33",
    ip: "172.23.0.2",
    ports: "-",
    ownership: "administrators",
  },
  {
    name: "wp-wordpress-1",
    state: "unhealthy",
    stack: "wp",
    image: "wordpress:latest",
    created: "2024-03-13 15:49:53",
    ip: "172.27.0.2",
    ports: "32771:80",
    ownership: "administrators",
  },
  // add more sample containers here
];

const stateColors: Record<string, string> = {
  running: "bg-green-100 text-green-800",
  healthy: "bg-green-100 text-green-800",
  unhealthy: "bg-yellow-100 text-yellow-800",
  stopped: "bg-red-100 text-red-800",
};

const StateBadge: React.FC<{ state: string }> = ({ state }) => {
  return (
    <span
      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
        stateColors[state] || "bg-gray-100 text-gray-800"
      }`}
    >
      {state}
    </span>
  );
};

const ContainersTable: React.FC = () => {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = containers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.image.toLowerCase().includes(search.toLowerCase()) ||
      c.state.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(paginated.map((c) => c.name));
    } else {
      setSelected([]);
    }
  };

  const toggleSelect = (name: string) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const ActionButton: React.FC<{ label: string; disabled?: boolean }> = ({
    label,
    disabled,
  }) => (
    <button
      className={`px-3 py-1 text-sm font-medium rounded-md border shadow-sm mr-2 mb-2 ${
        disabled
          ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
      }`}
      disabled={disabled}
    >
      {label}
    </button>
  );

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Containers</h2>
        <input
          type="text"
          placeholder="Search..."
          className="border rounded px-3 py-1 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center mb-4">
        {["Start", "Stop", "Kill", "Restart", "Pause", "Resume", "Remove"].map(
          (action) => (
            <ActionButton
              key={action}
              label={action}
              disabled={selected.length === 0}
            />
          )
        )}
        <ActionButton label="+ Add container" />
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={
                    selected.length === paginated.length && paginated.length > 0
                  }
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                />
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                State
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stack
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Image
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                IP Address
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Published Ports
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ownership
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginated.map((c) => (
              <tr key={c.name}>
                <td className="px-4 py-2">
                  <input
                    type="checkbox"
                    checked={selected.includes(c.name)}
                    onChange={() => toggleSelect(c.name)}
                  />
                </td>
                <td className="px-4 py-2 font-medium text-gray-900">
                  {c.name}
                </td>
                <td className="px-4 py-2">
                  <StateBadge state={c.state} />
                </td>
                <td className="px-4 py-2">{c.stack}</td>
                <td className="px-4 py-2">{c.image}</td>
                <td className="px-4 py-2">{c.created}</td>
                <td className="px-4 py-2">{c.ip}</td>
                <td className="px-4 py-2">{c.ports}</td>
                <td className="px-4 py-2">{c.ownership}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-500">
          Page {currentPage} of {totalPages}
        </div>
        <div>
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            className="px-3 py-1 border rounded mr-2"
          >
            Prev
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            className="px-3 py-1 border rounded"
          >
            Next
          </button>
        </div>
        <select
          className="border rounded px-2 py-1 text-sm"
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
        >
          {[5, 10, 20].map((n) => (
            <option key={n} value={n}>
              {n} per page
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default ContainersTable;
