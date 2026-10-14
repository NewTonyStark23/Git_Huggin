import React, { useState } from 'react';
import { getDefinition } from '../utils/definitions';

interface TooltipProps {
  term: string;
  children: React.ReactNode;
  className?: string;
}

export function Tooltip({ term, children, className = '' }: TooltipProps) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const definition = getDefinition(term);

  if (!definition) return <span className={className}>{children}</span>;

  return (
    <span
      className={`relative inline-block cursor-help border-b border-dashed border-purple-400 ${className}`}
      onMouseEnter={(e) => {
        setShow(true);
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        setPos({ x: rect.left, y: rect.top });
      }}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          className="fixed z-[9999] max-w-xs px-3 py-2 text-sm bg-gray-900 text-white rounded-lg shadow-xl border border-purple-500/30 pointer-events-none"
          style={{
            left: Math.min(pos.x, window.innerWidth - 320),
            top: pos.y - 60,
          }}
        >
          <div className="font-bold text-purple-300 mb-1">{term}</div>
          <div className="text-gray-200">{definition}</div>
          <div className="absolute -bottom-1 left-4 w-2 h-2 bg-gray-900 border-r border-b border-purple-500/30 rotate-45" />
        </div>
      )}
    </span>
  );
}

export function DefSpan({ term, children }: { term: string; children?: React.ReactNode }) {
  const definition = getDefinition(term);
  const [show, setShow] = useState(false);

  if (!definition) return <span>{children || term}</span>;

  return (
    <span
      className="relative inline-block cursor-help border-b border-dashed border-purple-400/60 hover:border-purple-300 transition-colors"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children || term}
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 text-xs bg-gray-900/95 text-white rounded-lg shadow-xl border border-purple-500/40 z-50 pointer-events-none">
          <span className="block font-bold text-purple-300 mb-1">{term}</span>
          <span className="block text-gray-300">{definition}</span>
        </span>
      )}
    </span>
  );
}
