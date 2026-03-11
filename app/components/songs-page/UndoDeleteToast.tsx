'use client'

type UndoDeleteToastProps = {
  onUndo: () => void
}

export default function UndoDeleteToast({ onUndo }: UndoDeleteToastProps) {
  return (
    <div className="fixed bottom-4 right-4 card-strong px-4 py-3 shadow-lg flex items-center gap-3">
      <span className="text-sm">Song deleted.</span>
      <button onClick={onUndo} className="text-sm font-semibold button-link">
        Undo
      </button>
    </div>
  )
}
