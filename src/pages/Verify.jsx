import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { BackButton, PrimaryButton } from '../components/UI';
import { NumberKeyboard, StatusBar } from '../components/PhoneChrome';
import { useApp } from '../context/AppContext';
import { MOCK_OTP } from '../utils';
export default function Verify() {
  const { phone, country, otpExpires, update } = useApp();
  const navigate = useNavigate();
  const refs = useRef([]);
  const activeIndex = useRef(0);
  const [digits, setDigits] = useState(Array(6).fill(''));
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);
  const remaining = Math.max(0, Math.ceil(((otpExpires || 0) - now) / 1000));
  if (!phone) return <Navigate to="/" replace />;
  function fill(text, index) {
    const numbers = text.replace(/\D/g, '').slice(0, 6 - index);
    if (!numbers) return;
    setDigits((previous) => {
      const next = [...previous];
      [...numbers].forEach((number, offset) => (next[index + offset] = number));
      return next;
    });
    refs.current[Math.min(index + numbers.length, 5)]?.focus();
    setError('');
  }
  function remove(index) {
    const target = digits[index] ? index : Math.max(0, index - 1);
    setDigits((previous) =>
      previous.map((value, offset) => (offset === target ? '' : value)),
    );
    refs.current[target]?.focus();
    setError('');
  }
  function submit(event) {
    event.preventDefault();
    if (digits.join('') !== MOCK_OTP) {
      setError(
        digits.some((digit) => !digit)
          ? 'Please enter all six digits.'
          : 'That code is incorrect. Use the demo code 123456.',
      );
      return;
    }
    update({ authenticated: true });
    navigate('/home', { replace: true });
  }
  return (
    <main className="auth-page verify-page">
      <StatusBar />
      <section className="auth-content">
        <BackButton to="/" />
        <h1>6-digit code</h1>
        <p className="intro">
          Please enter the code we’ve sent to
          <br />
          <strong>
            {country} {phone}
          </strong>
        </p>
        <form id="otp-form" onSubmit={submit}>
          <div className="otp-fields">
            {digits.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                ref={(element) => (refs.current[index] = element)}
                autoFocus={index === 0}
                aria-label={`OTP digit ${index + 1}`}
                aria-invalid={Boolean(error)}
                type="text"
                inputMode="none"
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                value={digit}
                maxLength={6}
                onChange={(event) => {
                  if (!event.target.value) {
                    setDigits((previous) =>
                      previous.map((value, offset) =>
                        offset === index ? '' : value,
                      ),
                    );
                    setError('');
                  } else fill(event.target.value, index);
                }}
                onPaste={(event) => {
                  event.preventDefault();
                  fill(event.clipboardData.getData('text'), index);
                }}
                onFocus={(event) => {
                  activeIndex.current = index;
                  event.target.select();
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Backspace') {
                    event.preventDefault();
                    remove(index);
                  }
                  if (event.key === 'ArrowLeft')
                    refs.current[Math.max(0, index - 1)]?.focus();
                  if (event.key === 'ArrowRight')
                    refs.current[Math.min(5, index + 1)]?.focus();
                }}
              />
            ))}
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <p className="resend">
            I didn’t receive a code{' '}
            <button
              className="text-button"
              type="button"
              disabled={remaining > 0}
              aria-label={remaining ? `Resend in ${remaining}s` : 'Resend OTP'}
              onClick={() => {
                update({ otpExpires: Date.now() + 30000 });
                setNow(Date.now());
                setDigits(Array(6).fill(''));
                setMessage('Demo code reset. Use 123456; no SMS was sent.');
                setError('');
                refs.current[0]?.focus();
              }}
            >
              {remaining
                ? `(00:${String(remaining).padStart(2, '0')})`
                : 'Resend OTP'}
            </button>
          </p>
          {message && (
            <p className="demo-note" role="status">
              {message}
            </p>
          )}
        </form>
        <p className="demo-note">
          Demo OTP: <strong>123456</strong> · No SMS is sent.
        </p>
      </section>
      <footer className="auth-actions">
        <PrimaryButton type="submit" form="otp-form">
          Continue
        </PrimaryButton>
      </footer>
      <NumberKeyboard
        onDigit={(digit) => fill(digit, activeIndex.current)}
        onDelete={() => remove(activeIndex.current)}
      />
    </main>
  );
}
