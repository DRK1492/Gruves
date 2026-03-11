'use client'

type SetlistHeaderProps = {
  openSetlistMenu: boolean
  onBack: () => void
  onDelete: () => void
  onRename: () => void
  setOpenSetlistMenu: (updater: (prev: boolean) => boolean) => void
  setlistName: string
}

export default function SetlistHeader({
  openSetlistMenu,
  onBack,
  onDelete,
  onRename,
  setOpenSetlistMenu,
  setlistName,
}: SetlistHeaderProps) {
  return (
    <>
      <div className="mb-4">
        <button onClick={onBack} className="button-link button-link-large">
          ← Back to Songs
        </button>
      </div>

      <div className="card p-6 mb-6 flex justify-between items-center">
        <div>
          <p className="label mb-2">Setlist</p>
          <h1 className="text-3xl font-semibold tracking-tight">{setlistName}</h1>
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
