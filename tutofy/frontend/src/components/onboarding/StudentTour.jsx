import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

const LS_SEEN = 'tutofy_student_tour_seen';
const LS_DONE = 'tutofy_student_tour_done';

const STEPS = [
  {
    type: 'welcome',
    title: 'Welcome to Tutofy!',
    body: "Let's spend 2 minutes exploring your learning workspace. We'll show you everything you need to start learning.",
  },
  {
    targetId: 'student-tour-courses',
    placement: 'right',
    title: 'Step 1 — My Courses',
    body: 'All your enrolled courses live here. Open any course to access lessons, materials, assignments, and quizzes.',
  },
  {
    targetId: 'student-tour-find-tutors',
    placement: 'right',
    title: 'Step 2 — Find Tutors',
    body: 'Browse the marketplace to discover tutors. Filter by subject, language, or price — then book a private lesson directly.',
  },
  {
    targetId: 'student-tour-schedule',
    placement: 'right',
    title: 'Step 3 — Your Schedule',
    body: 'See all your upcoming lessons in one place. Individual bookings, group lessons, and homework deadlines are shown here.',
  },
  {
    targetId: 'student-tour-homework',
    placement: 'right',
    title: 'Step 4 — Homework',
    body: 'View and submit assignments given by your tutors. Keep track of deadlines so you never miss a submission.',
  },
  {
    targetId: 'student-tour-progress',
    placement: 'right',
    title: 'Step 5 — Progress',
    body: 'Track your learning journey — completed lessons, quiz scores, and overall progress across all your courses.',
  },
  {
    targetId: 'student-tour-certificates',
    placement: 'right',
    title: 'Step 6 — Certificates',
    body: 'When you complete a course, you earn a certificate. Download and share it to showcase your achievement.',
  },
  {
    targetId: 'student-tour-messages',
    placement: 'right',
    title: 'Step 7 — Messages',
    body: 'Chat directly with your tutors. Ask questions, request resources, or discuss upcoming lessons.',
  },
  {
    type: 'complete',
    title: "You're ready to learn!",
    body: "Everything is set up. Start by exploring available tutors or dive straight into your enrolled courses. Good luck!",
  },
];

const SPOTLIGHT_STEPS = STEPS.filter(s => !s.type);
const TOOLTIP_W = 300;

function useElementRect(targetId) {
  const [rect, setRect] = useState(null);
  useLayoutEffect(() => {
    if (!targetId) { setRect(null); return; }
    const update = () => {
      const el = document.getElementById(targetId);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    update();
    const retry = setTimeout(update, 150);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      clearTimeout(retry);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [targetId]);
  return rect;
}

function computeTooltipPos(rect, placement) {
  if (!rect) return { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };
  const GAP = 16, EST_H = 210;
  const vw = window.innerWidth, vh = window.innerHeight;
  if (placement === 'right') {
    let left = rect.right + GAP;
    if (left + TOOLTIP_W > vw - GAP) left = rect.left - TOOLTIP_W - GAP;
    const top = Math.max(GAP, Math.min(vh - EST_H - GAP, rect.top + rect.height / 2 - EST_H / 2));
    return { left, top };
  }
  if (placement === 'bottom') {
    let top = rect.bottom + GAP;
    if (top + EST_H > vh - GAP) top = rect.top - EST_H - GAP;
    const left = Math.max(GAP, Math.min(vw - TOOLTIP_W - GAP, rect.left + rect.width / 2 - TOOLTIP_W / 2));
    return { left, top };
  }
  return { left: GAP, top: GAP };
}

export function useStudentTour() {
  const [active, setActive] = useState(() => localStorage.getItem(LS_SEEN) !== 'true');
  const restart = useCallback(() => {
    localStorage.removeItem(LS_SEEN);
    localStorage.removeItem(LS_DONE);
    setActive(true);
  }, []);
  const dismiss = useCallback(() => setActive(false), []);
  return { active, restart, dismiss };
}

export default function StudentTour({ onDismiss }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const rect    = useElementRect(current?.targetId);

  const isWelcome  = current?.type === 'welcome';
  const isComplete = current?.type === 'complete';
  const isModal    = isWelcome || isComplete;

  const spotlightIdx    = SPOTLIGHT_STEPS.findIndex(s => s === current);
  const isLastSpotlight = step === STEPS.length - 2;

  const handleSkip = useCallback(() => {
    localStorage.setItem(LS_SEEN, 'true');
    onDismiss?.();
  }, [onDismiss]);

  const handleDone = useCallback(() => {
    localStorage.setItem(LS_SEEN, 'true');
    localStorage.setItem(LS_DONE, 'true');
    onDismiss?.();
  }, [onDismiss]);

  const handleNext = useCallback(() => {
    setStep(s => (s < STEPS.length - 1 ? s + 1 : s));
    if (step === STEPS.length - 1) handleDone();
  }, [step, handleDone]);

  const handleBack = useCallback(() => setStep(s => (s > 1 ? s - 1 : s)), []);

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape')     handleSkip();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft')  handleBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleSkip, handleNext, handleBack]);

  const PAD = 8;
  const vw  = typeof window !== 'undefined' ? window.innerWidth  : 1280;
  const vh  = typeof window !== 'undefined' ? window.innerHeight : 800;
  const sX  = rect ? rect.left  - PAD : 0;
  const sY  = rect ? rect.top   - PAD : 0;
  const sW  = rect ? rect.width  + PAD * 2 : 0;
  const sH  = rect ? rect.height + PAD * 2 : 0;

  /* ── Modal steps ── */
  if (isModal) {
    return createPortal(
      <>
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', zIndex: 9997 }}
          onClick={isComplete ? handleDone : undefined} />
        <div style={{
          position: 'fixed', zIndex: 9999,
          top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          background: 'white', borderRadius: 24,
          padding: '40px 36px 32px',
          width: 460, maxWidth: 'calc(100vw - 32px)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
          textAlign: 'center',
          animation: 'student-tour-modal-in 0.25s ease-out',
        }}>
          {isWelcome ? (
            <>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(13,148,136,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="1.8" width={32} height={32}>
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0c0d12', margin: '0 0 10px', letterSpacing: -0.5 }}>{current.title}</h2>
              <p style={{ fontSize: 14, color: '#6b6f7d', lineHeight: 1.65, margin: '0 auto 28px', maxWidth: 360 }}>{current.body}</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button onClick={handleNext}
                  style={{ padding: '12px 28px', background: '#0d9488', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  Start Tour →
                </button>
                <button onClick={handleSkip}
                  style={{ padding: '12px 20px', background: 'transparent', color: '#6b6f7d', border: '1px solid #d2d4d9', borderRadius: 12, fontSize: 14, cursor: 'pointer' }}>
                  Skip for Now
                </button>
              </div>
              <p style={{ fontSize: 11, color: '#b0b3bc', marginTop: 16 }}>You can restart this tour any time from Settings.</p>
            </>
          ) : (
            <>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width={32} height={32}>
                  <path d="M5 12l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0c0d12', margin: '0 0 10px', letterSpacing: -0.5 }}>{current.title}</h2>
              <p style={{ fontSize: 14, color: '#6b6f7d', lineHeight: 1.65, margin: '0 auto 28px', maxWidth: 380 }}>{current.body}</p>
              <button onClick={handleDone}
                style={{ padding: '12px 32px', background: '#0d9488', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Let's go!
              </button>
            </>
          )}
        </div>
        <style>{`
          @keyframes student-tour-modal-in {
            from { opacity: 0; transform: translate(-50%,-47%) scale(0.96); }
            to   { opacity: 1; transform: translate(-50%,-50%) scale(1); }
          }
        `}</style>
      </>,
      document.body
    );
  }

  /* ── Spotlight steps ── */
  const tooltipPos = computeTooltipPos(rect, current.placement);

  return createPortal(
    <>
      <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 9997, pointerEvents: 'none' }}>
        <defs>
          <mask id="student-tour-mask">
            <rect fill="white" x={0} y={0} width={vw} height={vh} />
            {rect && <rect fill="black" x={sX} y={sY} width={sW} height={sH} rx="10" />}
          </mask>
        </defs>
        <rect fill="rgba(0,0,0,0.52)" x={0} y={0} width={vw} height={vh} mask="url(#student-tour-mask)" />
        {rect && <rect x={sX} y={sY} width={sW} height={sH} rx="10" fill="none" stroke="rgba(13,148,136,0.85)" strokeWidth="2.5" />}
      </svg>

      {rect ? (
        <>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: Math.max(0, sY), zIndex: 9996 }} />
          <div style={{ position: 'fixed', top: sY + sH, left: 0, right: 0, bottom: 0, zIndex: 9996 }} />
          <div style={{ position: 'fixed', top: sY, left: 0, width: Math.max(0, sX), height: sH, zIndex: 9996 }} />
          <div style={{ position: 'fixed', top: sY, left: sX + sW, right: 0, height: sH, zIndex: 9996 }} />
        </>
      ) : (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9996 }} />
      )}

      <div style={{
        position: 'fixed', zIndex: 9999,
        width: TOOLTIP_W,
        background: 'white',
        borderRadius: 16,
        padding: '18px 18px 14px',
        boxShadow: '0 16px 48px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
        animation: 'student-tour-tooltip-in 0.2s ease-out',
        ...tooltipPos,
      }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 13, alignItems: 'center' }}>
          {SPOTLIGHT_STEPS.map((_, i) => (
            <div key={i} style={{
              height: 4,
              width: i === spotlightIdx ? 20 : 8,
              borderRadius: 2,
              background: i <= spotlightIdx ? '#0d9488' : '#e2e4e9',
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }} />
          ))}
          <span style={{ fontSize: 11, color: '#b0b3bc', marginLeft: 2, flexShrink: 0 }}>
            {spotlightIdx + 1} / {SPOTLIGHT_STEPS.length}
          </span>
        </div>

        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0c0d12', margin: '0 0 5px', lineHeight: 1.3 }}>{current.title}</h3>
        <p style={{ fontSize: 12.5, color: '#6b6f7d', lineHeight: 1.55, margin: '0 0 14px' }}>{current.body}</p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={handleSkip} style={{ fontSize: 11.5, color: '#b0b3bc', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            Skip tour
          </button>
          <div style={{ display: 'flex', gap: 7 }}>
            {step > 1 && (
              <button onClick={handleBack} style={{ padding: '6px 13px', border: '1px solid #d2d4d9', borderRadius: 8, fontSize: 12, cursor: 'pointer', background: 'white', color: '#383a44' }}>
                ← Back
              </button>
            )}
            <button
              onClick={isLastSpotlight ? () => setStep(s => s + 1) : handleNext}
              style={{ padding: '6px 15px', background: '#0d9488', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              {isLastSpotlight ? 'Finish →' : 'Next →'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes student-tour-tooltip-in {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>,
    document.body
  );
}
