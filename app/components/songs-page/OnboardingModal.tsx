'use client'

type OnboardingModalProps = {
  onDismiss: () => void
}

export default function OnboardingModal({ onDismiss }: OnboardingModalProps) {
  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="label mb-2">Welcome</p>
            <h2 className="text-2xl font-semibold mb-2">Your library starts here</h2>
            <p className="muted">
              Add a few songs, tag them with genres, and build your first setlist.
            </p>
          </div>
          <button type="button" className="button-ghost modal-close" onClick={onDismiss}>
            Close
          </button>
        </div>
        <div className="grid gap-3">
          <div className="card-strong p-4">
            <p className="label mb-1">1. Add a song</p>
            <p className="text-sm muted">Use the form on this page to add your first song.</p>
          </div>
          <div className="card-strong p-4">
            <p className="label mb-1">2. Tag it</p>
            <p className="text-sm muted">Create a genre and assign it for quick filtering.</p>
          </div>
          <div className="card-strong p-4">
            <p className="label mb-1">3. Build a setlist</p>
            <p className="text-sm muted">Create a setlist and drag songs onto it.</p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button type="button" className="button-primary" onClick={onDismiss}>
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
