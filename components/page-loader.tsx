import Image from "next/image"
import { BRAND_NAME } from "@/lib/brand"

type PageLoaderProps = {
  compact?: boolean
}

export function PageLoader({ compact = false }: PageLoaderProps) {
  return (
    <div
      className={`flex min-h-screen items-center justify-center bg-background px-6 ${
        compact ? "py-16" : "py-24"
      }`}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="relative flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-border" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary" />
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-primary shadow-sm">
          <Image
            src="/logo.png"
            alt={BRAND_NAME}
            width={48}
            height={48}
            className="h-full w-full object-cover"
            priority
          />
        </div>
      </div>
    </div>
  )
}
