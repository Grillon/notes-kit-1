"use client";
import { useState } from "react";

type PasswordModalProps = {
  open: boolean;
  title: string;
  confirmLabel: string;
  onSubmit: (password: string) => Promise<void> | void;
  onCancel: () => void;
};

export function PasswordModal({
  open,
  title,
  confirmLabel,
  onSubmit,
  onCancel,
}: PasswordModalProps) {
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-4 rounded shadow w-80">
        <h2 className="text-lg font-bold mb-3">{title}</h2>
        <input
          type="password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          placeholder="Mot de passe"
          className="w-full p-2 mb-3 bg-gray-800 rounded"
        />
        <div className="flex justify-end gap-2">
          <button
            disabled={loading}
            onClick={onCancel}
            className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600"
          >
            Annuler
          </button>
          <button
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              await onSubmit(pwd);
              setLoading(false);
              setPwd("");
            }}
            className={`px-3 py-1 rounded ${
              loading ? "bg-gray-700" : "bg-blue-600 hover:bg-blue-500"
            }`}
          >
            {loading ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
