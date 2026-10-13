import { useState } from 'react';
import { Percent, ShoppingBag, X, MapPin, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { foods } from '../data/food';
import { cartCount, money } from '../utils';
import { Cart } from '../components/UI';
import FoodCard from '../components/FoodCard';
import ReferenceImage from '../components/ReferenceImage';
import { StatusBar, HomeIndicator } from '../components/PhoneChrome';
import LocationDialog from '../components/LocationDialog';
import useDialog from '../components/useDialog';
function OrderDialog({ food, onClose }) {
  const ref = useDialog(onClose);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        ref={ref}
        className="cart-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tracking-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <h2 id="tracking-title">Track Driver</h2>
          <button
            className="icon-button"
            aria-label="Close tracking"
            onClick={onClose}
          >
            <X />
          </button>
        </header>
        <ReferenceImage
          region={food.photo}
          alt={food.name}
          className="tracking-photo"
        />
        <h3>{food.name}</h3>
        <ol className="tracking-steps">
          <li>
            <Check size={17} />
            Order confirmed
          </li>
          <li>
            <Check size={17} />
            Prepared at the restaurant
          </li>
          <li>
            <MapPin size={17} />
            Driver on the way · 15–20 minutes
          </li>
        </ol>
        <p className="demo-note">
          Demo order status; no live driver or order is connected.
        </p>
      </section>
    </div>
  );
}
export default function Home() {
  const {
    cart,
    location = 'Model Town, New Delhi',
    cancelledOrders = [],
    update,
  } = useApp();
  const [showCart, setShowCart] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [tracked, setTracked] = useState(null);
  const [offerOpen, setOfferOpen] = useState(false);
  function cancel(id) {
    update((previous) => ({
      cancelledOrders: [...new Set([...(previous.cancelledOrders || []), id])],
    }));
  }
  return (
    <main className="home-page">
      <StatusBar />
      <header className="home-header">
        <button
          className="location-button"
          onClick={() => setLocationOpen(true)}
        >
          <span>Current Locations</span>
          <strong>{location}</strong>
        </button>
      </header>
      <div className="account-strip">
        <span>Karan</span>
        <div>
          <button
            className="offer-button"
            aria-label="View offer"
            aria-expanded={offerOpen}
            onClick={() => setOfferOpen(!offerOpen)}
          >
            <Percent size={24} strokeWidth={3} />
          </button>
          <button
            className="wallet-button"
            aria-label={`Open cart, ${cartCount(cart)} items`}
            onClick={() => setShowCart(true)}
          >
            <ShoppingBag size={23} />
            {cartCount(cart) > 0 && (
              <span className="badge">{cartCount(cart)}</span>
            )}
          </button>
        </div>
      </div>
      <section className="home-body">
        <section className="best-sellers">
          <h1>Best Seller</h1>
          <div className="best-seller-grid">
            {foods.map((food) => (
              <FoodCard food={food} key={food.id} />
            ))}
          </div>
        </section>
        <Link to="/food/pizza" className="promo">
          <div>
            <p>
              Experience our
              <br />
              delicious new dish
            </p>
            <strong>30% OFF</strong>
          </div>
          <ReferenceImage region="pizza" alt="Pizza offer" />
        </Link>
        <div className="banner-pagination" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        {offerOpen && (
          <div className="offer-info" role="status">
            30% off the new pizza — demo offer shown in the design.{' '}
            <Link to="/food/pizza">View dish</Link>
          </div>
        )}
        <section className="popular-section">
          <h2>Popular Items</h2>
          <div className="popular-list">
            {foods.slice(0, 2).map((food) => {
              const cancelled = cancelledOrders.includes(food.id);
              return (
                <article className="popular-item" key={food.id}>
                  <Link
                    to={`/food/${food.id}`}
                    aria-label={`View ${food.name}`}
                  >
                    <ReferenceImage region={food.photo} alt={food.name} />
                  </Link>
                  <div className="popular-content">
                    <div className="popular-title">
                      <Link to={`/food/${food.id}`}>
                        <h3>{food.name}</h3>
                      </Link>
                      <strong>{money(food.price)}</strong>
                    </div>
                    <div className="order-meta">
                      <span>{food.time}</span>
                      <span>2 items</span>
                    </div>
                    {cancelled ? (
                      <p className="cancelled-status" role="status">
                        Order cancelled{' '}
                        <Link to={`/food/${food.id}`}>Order again</Link>
                      </p>
                    ) : (
                      <div className="order-actions">
                        <button onClick={() => cancel(food.id)}>
                          Cancel Order
                        </button>
                        <button onClick={() => setTracked(food)}>
                          Track Driver
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </section>
      <HomeIndicator />
      {showCart && <Cart onClose={() => setShowCart(false)} />}{' '}
      {locationOpen && (
        <LocationDialog
          location={location}
          onClose={() => setLocationOpen(false)}
          onSave={(value) => {
            update({ location: value });
            setLocationOpen(false);
          }}
        />
      )}{' '}
      {tracked && (
        <OrderDialog food={tracked} onClose={() => setTracked(null)} />
      )}
    </main>
  );
}
