import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { ContainerDetailModal } from "../components/container/ContainerDetail";

const InspectContainer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => setIsOpen(false);

  if (!id) {
    return (
      <div className="text-center text-red-500 dark:text-red-400">
        Container ID not provided.
      </div>
    );
  }

  return (
    <div className="w-full p-1 rounded-lg shadow dark:bg-black dark:text-gray-100">
      {isOpen && <ContainerDetailModal id={id} onClose={handleClose} />}
    </div>
  );
};

export default InspectContainer;
