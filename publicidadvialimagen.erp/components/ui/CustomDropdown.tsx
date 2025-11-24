"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export function CustomDropdown(props: {
  options?: Array<{ value: string | number; label: string; disabled?: boolean }>
  value?: string | number
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
  className?: string
  disabled?: boolean
  "aria-label"?: string
  classNames?: any
  components?: any
  [key: string]: any
}) {
  const { 
    options, 
    value, 
    onChange, 
    className, 
    disabled, 
    "aria-label": ariaLabel,
    classNames,
    components,
    ...selectProps 
  } = props

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onChange) {
      onChange(e)
    }
  }

  return (
    <div className="relative">
      <select
        className={cn(
          "appearance-none bg-transparent border-none outline-none text-sm font-medium text-gray-900 cursor-pointer w-full",
          "px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          "pr-8",
          className
        )}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        aria-label={ariaLabel}
        {...selectProps}
      >
        {options?.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg
          className="w-4 h-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  )
}

