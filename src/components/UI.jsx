import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { cartCount, cartSubtotal, money } from '../utils';
import useDialog from './useDialog';
import ReferenceImage from './ReferenceImage';
export function BackButton({ to = -1 }) {
  const navigate = useNavigate();
  return (
    <button
      className="icon-button"
      aria-label="Go back"
      onClick={() => navigate(to)}
    >
      <ArrowLeft size={21} />
    </button>
  );
}
export function PrimaryButton({ children, loading, ...props }) {
  return (
    <button
      className="primary-button"
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? 'Please wait…' : children}
    </button>
  );
}
export function Quantity({ value, onChange, minimum = 1 }) {
  return (
    <div className="quantity">
      <button
        aria-label="Decrease quantity"
        disabled={value <= minimum}
        onClick={() => onChange(value - 1)}
      >
        <Minus size={16} />
      </button>
      <span aria-live="polite">{value}</span>
      <button
        aria-label="Increase quantity"
        disabled={value >= 99}
        onClick={() => onChange(value + 1)}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
export function Cart({ onClose }) {
  const { cart, changeQuantity } = useApp();
  const dialogRef = useDialog(onClose);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        ref={dialogRef}
        className="cart-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <span className="eyebrow">YOUR GOOD FOOD</span>
            <h2 id="cart-title">
              Your bag <span className="muted">({cartCount(cart)})</span>
            </h2>
          </div>
          <button
            autoFocus
            className="icon-button"
            aria-label="Close cart"
            onClick={onClose}
          >
            <X />
          </button>
        </header>
        {cart.length ? (
          <>
            <div className="cart-items">
              {cart.map((item) => (
                <article className="cart-item" key={item.key}>
                  <ReferenceImage region={item.photo} alt={item.name} />
                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.options.join(' · ') || 'Regular'}</p>
                    <strong>{money(item.price * item.quantity)}</strong>
                  </div>
                  <Quantity
                    value={item.quantity}
                    minimum={0}
                    onChange={(value) =>
                      changeQuantity(item.key, value - item.quantity)
                    }
                  />
                </article>
              ))}
            </div>
            <div className="cart-total">
              <span>Subtotal</span>
              <strong>{money(cartSubtotal(cart))}</strong>
            </div>
            <p className="demo-note">
              Demo bag only. No payments or orders are processed.
            </p>
          </>
        ) : (
          <div className="empty-state">
            <ShoppingBag size={40} />
            <h3>Your bag is waiting</h3>
            <p>Add something delicious to get started.</p>
          </div>
        )}
        <button className="primary-button" onClick={onClose}>
          Keep exploring
          <ArrowRight size={19} />
        </button>
      </section>
    </div>
  );
}
