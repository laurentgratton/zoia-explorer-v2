import React from 'react';

interface DisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DisclaimerModal({ isOpen, onClose }: DisclaimerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[200] p-4">
      <div 
        className="bg-gray-800 border border-red-900/50 p-6 rounded-lg shadow-2xl max-w-md w-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4 text-red-500">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <h3 className="text-xl font-bold">Important Disclaimer</h3>
        </div>
        
        <div className="text-gray-200 space-y-4 mb-6 leading-relaxed">
          <p>
            Zoia Explorer V2 is a work in progress and allows you to edit base .bin Zoia and Euroburo patches.
          </p>
          <p className="font-semibold text-red-400">
            Please use the patches generated at your own risk, as we offer no guarantee or warranty that they will work, and it could cause irreversible damage to your unit.
          </p>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold transition-colors shadow-lg"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
