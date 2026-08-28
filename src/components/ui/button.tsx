import React from "react";

export function Button({ className = "", variant = "default", type = "button", ...props }: any) {
  const base = "inline-flex items-center justify-center font-semibold transition disabled:pointer-events-none disabled:opacity-50";
  const variants: Record<string,string> = {
    default: "bg-stone-900 text-white hover:bg-stone-800",
    outline: "border border-stone-300 bg-white text-stone-900 hover:bg-stone-100",
    ghost: "bg-transparent text-stone-900 hover:bg-stone-100",
  };
  return <button type={type} className={`${base} ${variants[variant] || variants.default} ${className}`} {...props} />;
}
