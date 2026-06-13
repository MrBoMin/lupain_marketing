export function getInitials(name?: string | null, email?: string | null) {
  const nameInitials = name
    ?.trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()

  if (nameInitials) {
    return nameInitials.slice(0, 2)
  }

  return email?.trim()?.[0]?.toUpperCase() || "U"
}
