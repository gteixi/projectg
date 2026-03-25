'use client'

import { useState } from 'react'
import { COOK_COLORS, cookColorIndex } from './CookBadge'

function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

export function CookAvatarGroup({ names }: { names: string[] }) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null)

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {names.map((name, i) => {
        const { bg, text } = COOK_COLORS[cookColorIndex(name)]
        const isActive = activeIdx === i
        return (
          <button
            key={name}
            onClick={() => setActiveIdx(isActive ? null : i)}
            className={`flex items-center gap-1.5 rounded-full transition-all ${isActive ? `${bg} pl-1 pr-2.5 py-0.5` : ''}`}
          >
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${bg} ${text}`}>
              {initials(name)}
            </span>
            {isActive && (
              <span className={`text-sm font-semibold whitespace-nowrap ${text}`}>{name}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
