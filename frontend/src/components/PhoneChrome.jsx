import { BatteryFull, Signal, Wifi, Delete } from 'lucide-react';
export function StatusBar() {
  return (
    <div className="status-bar" aria-hidden="true">
      <span>9:41</span>
      <div>
        <Signal size={14} fill="currentColor" />
        <Wifi size={13} />
        <BatteryFull size={21} fill="currentColor" />
      </div>
    </div>
  );
}
export function HomeIndicator() {
  return <div className="home-indicator" aria-hidden="true" />;
}
const letters = ['', 'ABC', 'DEF', 'GHI', 'JKL', 'MNO', 'PQRS', 'TUV', 'WXYZ'];
export function NumberKeyboard({ onDigit, onDelete }) {
  return (
    <div className="number-keyboard" aria-label="Numeric keypad">
      <div className="keyboard-grid">
        {Array.from({ length: 9 }, (_, index) => (
          <button
            key={index + 1}
            type="button"
            aria-label={`Type ${index + 1}`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onDigit(String(index + 1))}
          >
            <span>{index + 1}</span>
            <small>{letters[index]}</small>
          </button>
        ))}
        <span />
        <button
          type="button"
          aria-label="Type 0"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onDigit('0')}
        >
          <span>0</span>
        </button>
        <button
          type="button"
          className="keyboard-delete"
          aria-label="Delete digit"
          onMouseDown={(event) => event.preventDefault()}
          onClick={onDelete}
        >
          <Delete size={22} />
        </button>
      </div>
    </div>
  );
}
