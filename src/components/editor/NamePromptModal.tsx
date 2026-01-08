import React, { useState } from 'react';

interface NamePromptModalProps {
  isOpen: boolean;
  title: string;
  initialValue: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
  confirmLabel?: string;
}

export default function NamePromptModal({
  isOpen,
  title,
  initialValue,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm'
}: NamePromptModalProps) {
  const [name, setName] = useState(initialValue);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(name);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-100" onClick={onCancel}>
      <div 
        className="bg-gray-800 border border-gray-700 p-6 rounded-lg shadow-xl w-96"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
        <form onSubmit={handleSubmit}>
          <input
            autoFocus
            type="text"
            className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white mb-4 focus:border-violet-500 outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter name..."
          />
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded font-medium transition-colors"
            >
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
