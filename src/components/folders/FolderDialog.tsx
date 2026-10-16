import React, { useEffect, useId, useRef } from 'react';

export const buttonClass =
  'rounded border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-violet-400 disabled:opacity-40 disabled:cursor-not-allowed';
export const primaryClass = `${buttonClass} !border-violet-500 !bg-violet-600 !text-white hover:!bg-violet-500`;
export const inputClass =
  'w-full rounded border border-gray-600 bg-gray-950 px-3 py-2 text-sm text-white focus:outline-2 focus:outline-violet-400';

export default function FolderDialog({
  title,
  children,
  onClose,
  busy = false,
  wide = false,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  busy?: boolean;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement as HTMLElement | null;
    dialog.showModal();
    return () => {
      dialog.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      className={`m-auto max-h-[90dvh] w-[calc(100%-2rem)] ${wide ? 'max-w-3xl' : 'max-w-lg'} overflow-y-auto rounded-xl border border-gray-600 bg-gray-900 p-6 text-gray-200 shadow-2xl backdrop:bg-black/70`}
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 id={titleId} className="text-lg font-semibold text-white">
          {title}
        </h2>
        <button
          type="button"
          aria-label="Close dialog"
          disabled={busy}
          onClick={onClose}
          className={buttonClass}
        >
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}
