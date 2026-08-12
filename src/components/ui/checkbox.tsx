import * as React from "react"
import { Check } from "lucide-react"

export interface CheckboxProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    return (
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => onCheckedChange?.(!checked)}
        className={`peer h-4 w-4 shrink-0 rounded-md border border-slate-300 bg-white ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center transition-all ${
          checked ? 'bg-blue-600 border-blue-600 text-white' : 'text-transparent hover:border-slate-400'
        } ${className || ''}`}
        ref={ref}
        {...props}
      >
        <Check className="h-3 w-3 stroke-[3]" />
      </button>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
