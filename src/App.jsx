import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Phone from './pages/Phone';
import Verify from './pages/Verify';
import Home from './pages/Home';
import Details from './pages/Details';
function Protected({ children }) {
  const { authenticated } = useApp();
  return authenticated ? children : <Navigate to="/" replace />;
}
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
function FoodDetails() {
  const { pathname } = useLocation();
  return <Details key={pathname} />;
}
export default function App() {
  return (
    <AppProvider>
      <ScrollToTop />
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Phone />} />
          <Route path="/verify" element={<Verify />} />
          <Route
            path="/home"
            element={
              <Protected>
                <Home />
              </Protected>
            }
          />
          <Route
            path="/food/:id"
            element={
              <Protected>
                <FoodDetails />
              </Protected>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </AppProvider>
  );
}
