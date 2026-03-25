export const COOK_COLORS = [
  { bg: 'bg-blue-600',   text: 'text-white' },
  { bg: 'bg-red-600',    text: 'text-white' },
  { bg: 'bg-green-600',  text: 'text-white' },
  { bg: 'bg-yellow-400', text: 'text-gray-900' },
  { bg: 'bg-purple-600', text: 'text-white' },
  { bg: 'bg-orange-500', text: 'text-white' },
  { bg: 'bg-cyan-500',   text: 'text-white' },
  { bg: 'bg-pink-600',   text: 'text-white' },
]

export function cookColorIndex(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return hash % COOK_COLORS.length
}

export function CookBadge({ name }: { name: string }) {
  const { bg, text } = COOK_COLORS[cookColorIndex(name)]
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold ${bg} ${text}`}>
      {name}
    </span>
  )
}
