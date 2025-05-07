import * as React from "react"

export function Logo({ className = "w-8 h-8 mr-2" }) {
  return (
    <span className={className} style={{ display: 'inline-flex', alignItems: 'center' }}>
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="16" fill="#334155" />
        <circle cx="15" cy="15" r="6" stroke="#f8fafc" strokeWidth="2" fill="none" />
        <line x1="20.5" y1="20.5" x2="26" y2="26" stroke="#f8fafc" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="ml-2 font-extrabold text-xl tracking-tight text-slate-900 dark:text-slate-100 select-none">Auction Scout</span>
    </span>
  )
} 