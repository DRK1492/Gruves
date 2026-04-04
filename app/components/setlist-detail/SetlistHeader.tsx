'use client'

type SetlistHeaderProps = {
  openSetlistMenu: boolean
  onBack: () => void
  onDelete: () => void
  onRename: () => void
  setOpenSetlistMenu: (updater: (prev: boolean) => boolean) => void
  setlistName: string
  songCount: number
}

export default function SetlistHeader({
  openSetlistMenu,
  onBack,
  onDelete,
  onRename,
  setOpenSetlistMenu,
  setlistName,
  songCount,
}: SetlistHeaderProps) {
  return (
    <>
      <div className="mb-3">
        <button onClick={onBack} className="breadcrumb-link">
          ← Setlists
        </button>
      </div>

      <div className="card p-6 mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-1">{setlistName}</h1>
          <p className="muted text-sm">{songCount === 1 ? '1 song' : `${songCount} songs`}</p>
        </div>
        <div className="menu-container" onClick={event => event.stopPropagation()}>
          <button
            type="button"
            className="button-ghost menu-trigger"
            onClick={event => {
              event.stopPropagation()
              setOpenSetlistMenu(prev => !prev)
            }}
          >
            <span className="menu-dots" aria-hidden="true">⋯</span>
            <span className="sr-only">Setlist actions</span>
          </button>
          {openSetlistMenu && (
            <div className="menu" onClick={event => event.stopPropagation()}>
              <button
                type="button"
                className="menu-item"
                onClick={() => {
                  onRename()
                  setOpenSetlistMenu(() => false)
                }}
              >
                Rename
              </button>
              <button
                type="button"
                className="menu-item menu-danger"
                onClick={() => {
                  onDelete()
                  setOpenSetlistMenu(() => false)
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
