import type { ComponentProps } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "arcade-login" | "arcade-register";

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
};

const defaultClasses = "rounded px-4 py-2 font-medium focus-visible:outline-blue-600";
const arcadeClasses =
  "min-h-14 min-w-0 appearance-none select-none rounded-[1.4rem] border-2 px-3 py-3 text-lg font-extrabold text-white sm:min-h-16 sm:text-2xl sm:compact-desktop:min-h-12 sm:compact-desktop:py-2 sm:compact-desktop:text-lg focus-visible:outline-cyan-100 enabled:cursor-pointer enabled:active:brightness-95 disabled:shadow-none motion-safe:transition-[filter,box-shadow,translate] motion-safe:duration-150 motion-safe:enabled:hover:-translate-y-0.5 motion-safe:enabled:active:translate-y-0.5";

const variantClasses: Record<ButtonVariant, string> = {
  primary: `${defaultClasses} bg-neutral-900 text-white hover:bg-neutral-700`,
  secondary: `${defaultClasses} border border-neutral-400 bg-white text-neutral-900 hover:bg-neutral-100`,
  ghost: `${defaultClasses} text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900`,
  "arcade-register": `${arcadeClasses} border-[#ffdf38] bg-[linear-gradient(180deg,#ffb800_0%,#ff8d00_50%,#f76a00_100%)] shadow-[inset_0_2px_1px_#ffdf3860,0_3px_0_#ba4200,0_5px_12px_#0005] [text-shadow:0_2px_2px_#6b2b00,1px_0_1px_#6b2b00,-1px_0_1px_#6b2b00,0_-1px_1px_#6b2b00] enabled:hover:shadow-[inset_0_2px_1px_#ffdf3880,0_3px_0_#ba4200,0_0_20px_#ffad0060]`,
  "arcade-login": `${arcadeClasses} border-[#24d8ff] bg-[linear-gradient(180deg,#00a8ff_0%,#0078f8_50%,#0043e4_100%)] shadow-[inset_0_2px_1px_#24d8ff60,0_3px_0_#002e96,0_5px_12px_#0005] [text-shadow:0_2px_2px_#003372,1px_0_1px_#003372,-1px_0_1px_#003372,0_-1px_1px_#003372] enabled:hover:shadow-[inset_0_2px_1px_#24d8ff80,0_3px_0_#002e96,0_0_20px_#008cff60]`,
};

export function Button({ variant = "primary", type = "button", className, ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className ?? ""}`}
      {...props}
    />
  );
}
