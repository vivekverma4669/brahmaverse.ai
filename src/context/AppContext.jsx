import { createContext, useCallback, useContext, useState } from 'react';
const AppContext = createContext(null);
function readSession() {
  try {
    return JSON.parse(sessionStorage.getItem('fastor-v2') || '{}');
  } catch {
    return {};
  }
}
export function AppProvider({ children }) {
  const [state, setState] = useState(readSession);
  const update = useCallback((patch) => {
    setState((previous) => {
      const next = {
        ...previous,
        ...(typeof patch === 'function' ? patch(previous) : patch),
      };
      sessionStorage.setItem('fastor-v2', JSON.stringify(next));
      return next;
    });
  }, []);
  function addToCart(food, quantity, options) {
    setState((previous) => {
      const key = food.id + ':' + [...options].sort().join(',');
      const cart = [...(previous.cart || [])];
      const existing = cart.find((item) => item.key === key);
      if (existing) {
        const index = cart.indexOf(existing);
        cart[index] = { ...existing, quantity: existing.quantity + quantity };
      } else
        cart.push({
          key,
          id: food.id,
          name: food.name,
          price: food.price,
          photo: food.photo,
          quantity,
          options,
        });
      const next = { ...previous, cart };
      sessionStorage.setItem('fastor-v2', JSON.stringify(next));
      return next;
    });
  }
  function changeQuantity(key, delta) {
    setState((previous) => {
      const cart = (previous.cart || [])
        .map((item) =>
          item.key === key
            ? { ...item, quantity: item.quantity + delta }
            : item,
        )
        .filter((item) => item.quantity > 0);
      const next = { ...previous, cart };
      sessionStorage.setItem('fastor-v2', JSON.stringify(next));
      return next;
    });
  }
  return (
    <AppContext.Provider
      value={{
        ...state,
        cart: state.cart || [],
        update,
        addToCart,
        changeQuantity,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
export const useApp = () => useContext(AppContext);
