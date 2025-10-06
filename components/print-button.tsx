"use client";

export default function PrintButton({ className = "px-3 py-1 bg-gray-800 text-white rounded" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== 'undefined') window.print();
      }}
      className={className}
    >
      Imprimir
    </button>
  );
}

