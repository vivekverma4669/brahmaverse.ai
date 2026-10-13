import { useState } from 'react';
import { X } from 'lucide-react';
import useDialog from './useDialog';
export default function LocationDialog({ location, onSave, onClose }) {
  const [draft, setDraft] = useState(location);
  const ref = useDialog(onClose);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        ref={ref}
        className="cart-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-title"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          if (draft.trim()) onSave(draft.trim());
        }}
      >
        <header>
          <h2 id="location-title">Delivery location</h2>
          <button
            className="icon-button"
            type="button"
            aria-label="Close location"
            onClick={onClose}
          >
            <X />
          </button>
        </header>
        <label htmlFor="location">Your area or neighbourhood</label>
        <input
          className="location-input"
          id="location"
          autoFocus
          required
          maxLength={60}
          pattern=".*\S.*"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <p className="demo-note">
          Demo location only; availability is not checked.
        </p>
        <button className="primary-button" type="submit">
          Save location
        </button>
      </form>
    </div>
  );
}
