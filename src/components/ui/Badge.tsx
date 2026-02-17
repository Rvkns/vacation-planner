import * as React from "react"
import { cn } from "@/lib/utils"

const Badge = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'success' | 'warning' | 'danger' }>(
    ({ className, variant = 'default', ...props }, ref) => {
        const variants = {
            default: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
            danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        };

        return (
            <div
                ref={ref}
                className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
                    variants[variant],
                    className
                )}
                {...props}
            />
        )
    }
)
Badge.displayName = "Badge"

export { Badge }
