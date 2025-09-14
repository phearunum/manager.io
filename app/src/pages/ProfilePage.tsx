// src/pages/ProfilePage.tsx
import React, { useState, useEffect } from "react";

const ProfilePage: React.FC = () => {
  const [fontSize, setFontSize] = useState<number>(() => {
    // Load font size from localStorage or default to 16
    if (typeof localStorage !== "undefined") {
      const stored = localStorage.getItem("profileFontSize");
      return stored ? parseInt(stored) : 16;
    }
    return 16;
  });

  useEffect(() => {
    localStorage.setItem("profileFontSize", fontSize.toString());
  }, [fontSize]);

  const increaseFont = () => setFontSize((prev) => Math.min(prev + 2, 32));
  const decreaseFont = () => setFontSize((prev) => Math.max(prev - 2, 12));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Profile Page</h1>

      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={decreaseFont}
          className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded"
        >
          A-
        </button>
        <button
          onClick={increaseFont}
          className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded"
        >
          A+
        </button>
        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
          Current font size: {fontSize}px
        </span>
      </div>

      <div
        className="bg-white dark:bg-gray-800 p-4 rounded shadow"
        style={{ fontSize }}
      >
        <p>
          Welcome to your profile! Here you can see your information, adjust the
          font size, and customize your experience. This text will change size
          as you click the A+ / A- buttons.
        </p>
        <p className="mt-2">
          Font size preference is stored in <code>localStorage</code> and will
          persist across page reloads.
        </p>
      </div>
    </div>
  );
};

export default ProfilePage;
