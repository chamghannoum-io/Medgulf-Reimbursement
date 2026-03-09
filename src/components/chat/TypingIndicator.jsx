import React from 'react'

const TypingIndicator = React.memo(function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 px-4 py-1">
      {/* Avatar */}
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
        MG
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-none bg-white px-4 py-3 shadow-sm">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-gray-400"
            style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </div>
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  )
})

export default TypingIndicator
