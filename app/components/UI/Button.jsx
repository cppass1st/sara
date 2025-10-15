"use client";

export default function Button({
  children,
  onClick,
  disabled = false,
  variant = "primary", // primary | secondary | muted | success | danger
  leftIcon,
  rightIcon,
  pressOnClick = false, // ← добавили: анимация «вжатия»
  className = "",
}) {
  const base =
    [
      "relative inline-flex items-center gap-2 rounded-xl",
      "px-4 py-2.5 h-11",                      // фиксируем высоту
      "font-medium shadow-sm ring-1",
      "transition duration-200",
      "focus:outline-none focus-visible:ring-2",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      pressOnClick ? "active:scale-[0.98]" : "", // ← мягкое вжатие
    ].join(" ");

  const variants = {
    primary:
      "bg-blue-600/90 text-white ring-blue-700/30 hover:bg-blue-600 hover:shadow-md",
    secondary:
      "bg-indigo-600/90 text-white ring-indigo-700/30 hover:bg-indigo-600 hover:shadow-md",
    muted:
      "bg-gray-200 text-gray-800 ring-gray-300 hover:bg-gray-300",
    success:
      "bg-emerald-500/90 text-white ring-emerald-600/30 hover:bg-emerald-500 hover:shadow-md",
    danger:
      "bg-red-500/90 text-white ring-red-600/30 hover:bg-red-500 hover:shadow-md",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[base, variants[variant], className].join(" ")}
    >
      {leftIcon ? <span className="inline-flex">{leftIcon}</span> : null}
      {/* не переносим текст на вторую строку */}
      <span className="tracking-tight whitespace-nowrap leading-tight">
        {children}
      </span>
      {rightIcon ? <span className="inline-flex">{rightIcon}</span> : null}
    </button>
  );
}
