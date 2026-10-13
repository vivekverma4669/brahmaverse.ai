import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackButton, PrimaryButton } from '../components/UI';
import { NumberKeyboard, StatusBar } from '../components/PhoneChrome';
import { useApp } from '../context/AppContext';
import { validPhone } from '../utils';
export default function Phone() {
  const { phone = '', country = '+91', update } = useApp();
  const [number, setNumber] = useState(phone);
  const [code, setCode] = useState(country);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();
  function submit(event) {
    event.preventDefault();
    if (!validPhone(number, code)) {
      setError(
        `Enter a valid ${code === '+44' ? '10 or 11' : '10'}-digit phone number.`,
      );
      inputRef.current?.focus();
      return;
    }
    update({
      phone: number,
      country: code,
      otpExpires: Date.now() + 30000,
      authenticated: false,
    });
    navigate('/verify');
  }
  return (
    <main className="auth-page">
      <StatusBar />
      <section className="auth-content">
        <BackButton />
        <h1>Sign Up to Fastor</h1>
        <p className="intro">
          Let us know your mobile number and we will send
          <br className="wide-break" /> you an OTP for verification.
        </p>
        <form id="phone-form" onSubmit={submit}>
          <label className="sr-only" htmlFor="phone">
            Phone number
          </label>
          <div className={`phone-field ${error ? 'invalid' : ''}`}>
            <select
              aria-label="Country calling code"
              value={code}
              onChange={(event) => {
                setCode(event.target.value);
                setError('');
              }}
            >
              <option value="+91">+91</option>
              <option value="+1">+1</option>
              <option value="+44">+44</option>
            </select>
            <input
              ref={inputRef}
              id="phone"
              type="tel"
              inputMode="none"
              autoComplete="tel-national"
              placeholder="· 00000"
              value={number}
              maxLength={11}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'phone-error' : undefined}
              onChange={(event) => {
                setNumber(event.target.value.replace(/\D/g, ''));
                setError('');
              }}
            />
          </div>
          {error && (
            <p className="error" id="phone-error" role="alert">
              {error}
            </p>
          )}
        </form>
      </section>
      <footer className="auth-actions">
        <PrimaryButton type="submit" form="phone-form">
          Get OTP
        </PrimaryButton>
        <p className="terms">
          By clicking, I accept the Terms &amp; Conditions and Privacy Policy
        </p>
      </footer>
      <NumberKeyboard
        onDigit={(digit) => {
          setNumber((previous) =>
            (previous + digit).slice(0, code === '+44' ? 11 : 10),
          );
          setError('');
          inputRef.current?.focus();
        }}
        onDelete={() => {
          setNumber((previous) => previous.slice(0, -1));
          inputRef.current?.focus();
        }}
      />
    </main>
  );
}
