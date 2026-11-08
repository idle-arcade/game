import { useId, type ComponentProps } from "react";
import { AlertCircleIcon } from "../icons";

type TextFieldProps = Omit<ComponentProps<"input">, "id"> & {
  label: string;
  /** Already translated error message; marks the input invalid when set. */
  error?: string;
  appearance?: "default" | "arcade";
};

export function TextField({
  label,
  error,
  appearance = "default",
  className,
  ...inputProps
}: TextFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  if (appearance === "arcade") {
    return (
      <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
        <div className="relative">
          <input
            {...inputProps}
            id={id}
            placeholder=" "
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={`peer h-16 w-full min-w-0 rounded-2xl border-2 pl-5 pt-6 pb-2 text-base text-white caret-cyan-200 outline-none transition-[background-color,border-color,box-shadow] duration-200 focus:ring-4 motion-reduce:transition-none sm:text-xl ${error ? "border-rose-400/75 bg-[#342338] pr-12 hover:border-rose-300 focus:border-rose-300 focus:ring-rose-300/15" : "border-[#777da5] bg-[#252944] pr-5 shadow-inner hover:border-indigo-200 hover:bg-[#2d3153] hover:shadow-[0_0_16px_#6f88ff20] focus:border-cyan-300 focus:bg-[#292e50] focus:ring-cyan-300/15"}`}
          />
          <label
            htmlFor={id}
            className={`pointer-events-none absolute top-2.5 left-5 origin-left text-xs transition-[top,translate,font-size,color] duration-200 ease-out peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-xs motion-reduce:transition-none sm:peer-placeholder-shown:text-xl sm:peer-focus:text-xs ${error ? "text-rose-200" : "text-indigo-200 peer-placeholder-shown:text-indigo-100 peer-focus:text-cyan-200"}`}
          >
            {label}
          </label>
          {error && (
            <AlertCircleIcon className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-rose-300" />
          )}
        </div>
        {error && (
          <p id={errorId} className="px-1 text-sm leading-relaxed text-rose-200">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1 ${className ?? ""}`}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="rounded border border-neutral-300 px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 aria-invalid:border-red-600"
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
