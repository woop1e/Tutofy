import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { paymentsAPI } from '../../api/payments';
import { enrollmentsAPI } from '../../api/enrollments';
import { lessonsAPI } from '../../api/lessons';
import { messagingAPI } from '../../api/messaging';
import { useAuth } from '../../contexts/AuthContext';

function formatCardNumber(raw) {
  return raw.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + '/' + digits.slice(2);
}

const CARD_ICONS = {
  visa:       '💳',
  mastercard: '💳',
  amex:       '💳',
  default:    '💳',
};

function detectNetwork(number) {
  const n = number.replace(/\s/g, '');
  if (/^4/.test(n))   return 'VISA';
  if (/^5[1-5]/.test(n)) return 'MC';
  if (/^3[47]/.test(n))  return 'AMEX';
  return '';
}

const PaymentPage = () => {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // lesson_mode=true means booking an individual lesson (not course enrollment)
  const lessonMode     = params.get('lesson_mode') === 'true';
  const courseId       = params.get('course_id') || '';
  const amount         = parseFloat(params.get('amount') || '0');
  const tutorId        = params.get('tutor_id')  || '';
  const courseName     = params.get('course_name') || 'Course';
  // Lesson-specific params
  const lessonTitle        = params.get('title') || 'Individual lesson';
  const lessonScheduledAt  = params.get('scheduled_at') || '';
  const lessonDuration     = parseInt(params.get('duration_minutes') || '60', 10);
  const lessonTutorName    = params.get('tutor_name') || '';

  const [cardNumber, setCardNumber] = useState('');
  const [holder, setHolder]         = useState('');
  const [expiry, setExpiry]         = useState('');
  const [cvv, setCvv]               = useState('');
  const [flipped, setFlipped]       = useState(false);

  const [step, setStep]     = useState('form'); // 'form' | 'processing' | 'success' | 'error'
  const [errMsg, setErrMsg] = useState('');

  const cvvRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  const network = detectNetwork(cardNumber);

  const isValid = () => {
    const digits = cardNumber.replace(/\s/g, '');
    const [mm, yy] = expiry.split('/').map(Number);
    const nowYear  = new Date().getFullYear() % 100;
    const nowMonth = new Date().getMonth() + 1;
    const validExp = mm >= 1 && mm <= 12 && (yy > nowYear || (yy === nowYear && mm >= nowMonth));
    return digits.length === 16 && holder.trim().length >= 2 && validExp && cvv.length >= 3;
  };

  const handlePay = async () => {
    if (!isValid()) return;
    setStep('processing');
    setErrMsg('');
    try {
      if (lessonMode) {
        // Individual lesson: create payment record, then book the lesson.
        const payment = await paymentsAPI.createPayment({ course_id: tutorId, amount });
        await paymentsAPI.completePayment(payment.payment_id);
        await lessonsAPI.bookIndividualLesson({
          tutor_id:         tutorId,
          title:            lessonTitle,
          scheduled_at:     lessonScheduledAt,
          duration_minutes: lessonDuration,
          price:            amount,
        });
        // Create conversation thread so student appears in tutor's messages search.
        messagingAPI.sendMessage({
          receiver_id: tutorId,
          content: `Hi! I've booked a lesson with you: "${lessonTitle}". Looking forward to our session!`,
        }).catch(() => {});
      } else {
        // Course enrollment payment.
        const payment = await paymentsAPI.createPayment({ course_id: courseId, amount });
        await paymentsAPI.completePayment(payment.payment_id);
        await enrollmentsAPI.enrollInCourse(courseId);
      }
      setStep('success');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || '';
      if (!lessonMode && (msg.includes('already enrolled') || msg.includes('AlreadyExists'))) {
        setStep('success');
      } else {
        setErrMsg(msg || 'Payment failed. Please try again.');
        setStep('error');
      }
    }
  };

  const maskedNum = cardNumber
    ? cardNumber.replace(/\s/g, '').padEnd(16, '•').replace(/(.{4})/g, '$1 ').trim()
    : '•••• •••• •••• ••••';

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[#f5f6fa] flex flex-col items-center justify-center font-sans p-6">
        <div className="bg-white rounded-[24px] border border-[#ebebf0] p-10 max-w-[420px] w-full text-center shadow-[0_8px_40px_rgba(76,110,255,0.10)]">
          <div className="w-20 h-20 rounded-full bg-[#edfaf3] flex items-center justify-center mx-auto mb-5">
            <svg viewBox="0 0 40 40" className="w-10 h-10 text-[#22be70]" fill="none">
              <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2.5"/>
              <path d="M12 20l6 6 10-12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-[#181b26] text-[22px] font-bold mb-2">Payment successful!</h1>
          {lessonMode ? (
            <>
              <p className="text-[#8a90a1] text-[14px] mb-1">Your lesson has been booked</p>
              <p className="text-[#4c6eff] text-[15px] font-semibold mb-2">"{lessonTitle}"</p>
              {lessonTutorName && (
                <p className="text-[#8a90a1] text-[13px] mb-4">with {lessonTutorName}</p>
              )}
              <p className="text-[#22be70] text-[13px] font-medium mb-6">
                The tutor has been notified and will send you a meeting link.
              </p>
            </>
          ) : (
            <>
              <p className="text-[#8a90a1] text-[14px] mb-1">You have been enrolled in</p>
              <p className="text-[#4c6eff] text-[15px] font-semibold mb-6">"{courseName}"</p>
            </>
          )}
          <button
            onClick={() => navigate('/student/dashboard')}
            className="w-full bg-[#4c6eff] text-white text-[14px] font-semibold py-3 rounded-[12px] hover:opacity-90 transition-opacity"
          >
            Go to my dashboard →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6fa] font-sans">

      {/* Navbar */}
      <nav className="bg-white border-b border-[#ebebf0] h-[60px] flex items-center px-8 sticky top-0 z-50">
        <div className="max-w-[900px] mx-auto w-full flex items-center justify-between">
          <Link to="/" className="text-[#4c6eff] text-[20px] font-bold">Tutofy</Link>
          <button
            onClick={() => navigate(-1)}
            className="text-[#8a90a1] text-[13px] hover:text-[#181b26] transition-colors"
          >
            ← Back
          </button>
        </div>
      </nav>

      <div className="max-w-[900px] mx-auto px-6 py-10">
        <h1 className="text-[#181b26] text-[24px] font-bold mb-1">Complete payment</h1>
        <p className="text-[#8a90a1] text-[14px] mb-8">
          {lessonMode
            ? <>Enter your card details to book <span className="text-[#181b26] font-medium">"{lessonTitle}"</span></>
            : <>Enter your card details to enroll in <span className="text-[#181b26] font-medium">"{courseName}"</span></>
          }
        </p>

        <div className="grid grid-cols-[1fr_340px] gap-8 items-start">

          {/* Left: form */}
          <div className="space-y-5">

            {/* Card preview */}
            <div
              className="relative h-[190px] rounded-[20px] overflow-hidden select-none cursor-default"
              style={{ background: 'linear-gradient(135deg,#4c6eff 0%,#935bf5 100%)' }}
            >
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 50%), radial-gradient(circle at 10% 80%, white 0%, transparent 50%)' }}
              />
              <div className="relative p-6 h-full flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="w-[42px] h-[32px] rounded-[6px] bg-[rgba(255,255,255,0.3)] flex items-center justify-center">
                    <div className="w-[28px] h-[20px] rounded-[4px] bg-[rgba(255,215,0,0.7)]" />
                  </div>
                  <span className="text-white text-[14px] font-bold tracking-widest opacity-90">
                    {network || 'CARD'}
                  </span>
                </div>
                <div>
                  <p className="text-white text-[18px] font-mono tracking-[3px] mb-3 opacity-95">
                    {maskedNum}
                  </p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[rgba(255,255,255,0.6)] text-[10px] uppercase tracking-widest mb-0.5">Card holder</p>
                      <p className="text-white text-[13px] font-medium uppercase tracking-wide">
                        {holder || 'FULL NAME'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[rgba(255,255,255,0.6)] text-[10px] uppercase tracking-widest mb-0.5">Expires</p>
                      <p className="text-white text-[13px] font-medium">{expiry || 'MM/YY'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card number */}
            <div>
              <label className="block text-[#181b26] text-[13px] font-semibold mb-1.5">Card number</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0000 0000 0000 0000"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                className="w-full border border-[#d2d4d9] rounded-[12px] px-4 py-3 text-[14px] text-[#181b26] placeholder-[#c0c3cc] font-mono tracking-widest focus:outline-none focus:border-[#4c6eff] transition-colors"
              />
            </div>

            {/* Cardholder */}
            <div>
              <label className="block text-[#181b26] text-[13px] font-semibold mb-1.5">Cardholder name</label>
              <input
                type="text"
                placeholder="First and last name"
                value={holder}
                onChange={(e) => setHolder(e.target.value.toUpperCase())}
                className="w-full border border-[#d2d4d9] rounded-[12px] px-4 py-3 text-[14px] text-[#181b26] placeholder-[#c0c3cc] uppercase tracking-wide focus:outline-none focus:border-[#4c6eff] transition-colors"
              />
            </div>

            {/* Expiry + CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[#181b26] text-[13px] font-semibold mb-1.5">Expiry date</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  className="w-full border border-[#d2d4d9] rounded-[12px] px-4 py-3 text-[14px] text-[#181b26] placeholder-[#c0c3cc] font-mono focus:outline-none focus:border-[#4c6eff] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[#181b26] text-[13px] font-semibold mb-1.5">CVV</label>
                <input
                  ref={cvvRef}
                  type="text"
                  inputMode="numeric"
                  placeholder="•••"
                  maxLength={4}
                  value={cvv}
                  onFocus={() => setFlipped(true)}
                  onBlur={() => setFlipped(false)}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full border border-[#d2d4d9] rounded-[12px] px-4 py-3 text-[14px] text-[#181b26] placeholder-[#c0c3cc] font-mono tracking-widest focus:outline-none focus:border-[#4c6eff] transition-colors"
                />
              </div>
            </div>

            {step === 'error' && (
              <div className="bg-[rgba(242,69,69,0.08)] text-[#f24545] rounded-[12px] px-4 py-3 text-[13px]">
                {errMsg}
              </div>
            )}

            <button
              onClick={handlePay}
              disabled={!isValid() || step === 'processing'}
              className="w-full bg-[#4c6eff] text-white text-[15px] font-semibold py-3.5 rounded-[14px] shadow-[0_4px_20px_rgba(76,110,255,0.35)] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {step === 'processing' ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing…
                </>
              ) : (
                <>Pay ${amount.toFixed(2)}</>
              )}
            </button>

            <p className="text-[#8a90a1] text-[11px] text-center flex items-center justify-center gap-1">
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-current"><path d="M8 0a3.5 3.5 0 0 0-3.5 3.5V5H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-1.5V3.5A3.5 3.5 0 0 0 8 0zm-2 3.5a2 2 0 1 1 4 0V5H6V3.5zM8 9a1 1 0 0 1 .5.866l.5 1.634H7l.5-1.634A1 1 0 0 1 8 9z"/></svg>
              Secured with 256-bit SSL encryption
            </p>
          </div>

          {/* Right: order summary */}
          <div className="bg-white rounded-[20px] border border-[#ebebf0] p-6 space-y-4">
            <h2 className="text-[#181b26] text-[16px] font-bold">Order summary</h2>

            <div className="bg-[#f5f6fa] rounded-[12px] p-4">
              {lessonMode ? (
                <>
                  <p className="text-[#8a90a1] text-[11px] uppercase tracking-widest font-semibold mb-1">Individual Lesson</p>
                  <p className="text-[#181b26] text-[14px] font-semibold leading-snug">{lessonTitle}</p>
                  {lessonTutorName && <p className="text-[#8a90a1] text-[12px] mt-0.5">with {lessonTutorName}</p>}
                  {lessonScheduledAt && (
                    <p className="text-[#4c6eff] text-[12px] font-medium mt-1">
                      {new Date(lessonScheduledAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {' · '}{lessonDuration} min
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-[#8a90a1] text-[11px] uppercase tracking-widest font-semibold mb-1">Course</p>
                  <p className="text-[#181b26] text-[14px] font-semibold leading-snug">{courseName}</p>
                </>
              )}
            </div>

            <div className="space-y-2 text-[13px]">
              <div className="flex justify-between">
                <span className="text-[#8a90a1]">{lessonMode ? `1 × ${lessonDuration} min lesson` : '1 × course'}</span>
                <span className="text-[#181b26] font-medium">${amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8a90a1]">Service fee</span>
                <span className="text-[#22be70] font-medium">Free</span>
              </div>
              <div className="border-t border-[#ebebf0] pt-2 flex justify-between text-[14px]">
                <span className="text-[#181b26] font-bold">Total</span>
                <span className="text-[#4c6eff] font-bold">${amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="rounded-[12px] bg-[#f0f9f4] p-3 text-[12px] text-[#22be70] font-medium flex items-start gap-2">
              <span className="text-[16px] leading-none">✓</span>
              <span>Money-back guarantee within 48 hours of your first lesson</span>
            </div>

            <div className="rounded-[12px] bg-[#f0f2ff] p-3 text-[12px] text-[#4c6eff] font-medium flex items-start gap-2">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 flex-shrink-0 mt-[-1px]"><path d="M10 3L2 7l8 4 8-4-8-4z"/><path d="M2 7v6M6 9.5v4a4 4 0 008 0v-4" strokeLinecap="round"/></svg>
              <span>Instant access to all course materials after payment</span>
            </div>

            {/* Accepted cards */}
            <div className="pt-2">
              <p className="text-[#8a90a1] text-[11px] mb-2">We accept</p>
              <div className="flex items-center gap-2">
                {['VISA', 'MC', 'AMEX', 'UNION'].map((card) => (
                  <span key={card} className="border border-[#d2d4d9] rounded-[6px] px-2 py-1 text-[10px] text-[#4c5162] font-bold">
                    {card}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
