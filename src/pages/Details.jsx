import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { foods } from '../data/food';
import { useApp } from '../context/AppContext';
import { BackButton, Cart, Quantity } from '../components/UI';
import ReferenceImage from '../components/ReferenceImage';
import { StatusBar, HomeIndicator } from '../components/PhoneChrome';
import { money } from '../utils';
export default function Details() {
  const { id } = useParams();
  const food = foods.find((item) => item.id === id);
  const { drafts = {}, update, addToCart } = useApp();
  const [quantity, setQuantity] = useState(
    drafts[id]?.quantity || (id === 'pizza' ? 3 : 1),
  );
  const [portion, setPortion] = useState(drafts[id]?.portion || '');
  const [added, setAdded] = useState(false);
  const [showCart, setShowCart] = useState(false);
  useEffect(() => {
    update((previous) => ({
      drafts: { ...previous.drafts, [id]: { quantity, portion } },
    }));
  }, [id, quantity, portion, update]);
  if (!food)
    return (
      <main className="empty-state">
        <h1>Dish not found</h1>
        <Link to="/home">Back to menu</Link>
      </main>
    );
  const price =
    food.portions.find((option) => option.name === portion)?.price ||
    food.price;
  return (
    <main className="details-page">
      <StatusBar />
      <section className="details-content">
        <div className="details-hero">
          <ReferenceImage
            region={food.photo}
            alt={id === 'pizza' ? 'Freshly baked pizza' : food.name}
          />
          <BackButton to="/home" />
        </div>
        <div className="price-quantity-row">
          <strong>{money(price)}</strong>
          <Quantity
            value={quantity}
            onChange={(value) => {
              setQuantity(value);
              setAdded(false);
            }}
          />
        </div>
        <div className="detail-divider" />
        <h1>{food.name}</h1>
        <p className="description">{food.description}</p>
        <fieldset className="portion-options">
          <legend>Personal portion</legend>
          {food.portions.map((option) => (
            <label key={option.name}>
              <span>{option.name}</span>
              <span className="portion-price">{money(option.price)}</span>
              <input
                type="radio"
                name="portion"
                value={option.name}
                checked={portion === option.name}
                onChange={() => {
                  setPortion(option.name);
                  setAdded(false);
                }}
              />
            </label>
          ))}
        </fieldset>
        {added && (
          <p role="status" className="added-message">
            Added {quantity} to your cart.{' '}
            <button className="text-button" onClick={() => setShowCart(true)}>
              View cart
            </button>
          </p>
        )}
      </section>
      <footer className="details-footer">
        <button
          className="primary-button"
          onClick={() => {
            addToCart({ ...food, price }, quantity, portion ? [portion] : []);
            setAdded(true);
          }}
        >
          Add to cart
        </button>
        <HomeIndicator />
      </footer>
      {showCart && <Cart onClose={() => setShowCart(false)} />}
    </main>
  );
}
