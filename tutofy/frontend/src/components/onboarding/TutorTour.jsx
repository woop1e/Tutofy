import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

const LS_SEEN = 'tutofy_tutor_tour_seen';
const LS_DONE = 'tutofy_tutor_tour_done';

const STEPS = [
  {
    type: 'welcome',
    title: 'Welcome to Tutofy Tutor LMS',
    body: "Let's spend 2 minutes getting familiar with your teaching workspace. We'll walk you through every key feature step by step.",
  },
  {
    targetId: 'tour-nav-profile',
    placement: 'right',
    title: 'Step 1 — Complete Your Profile',
    body: 'Tell students who you are. Add your bio, subjects, teaching experience, education, and certifications to create your professional listing and get admin approval.',
  },
  {
    targetId: 'tour-nav-schedule',
    placement: 'right',
    title: 'Step 2 — Set Your Availability',
    body: 'Configure when students can book lessons with you. Your profile won\'t appear in the marketplace until availability is set.',
  },
  {
    targetId: 'tour-nav-courses',
    placement: 'right',
    title: 'Step 3 — Create a Course',
    body: 'Go to Courses and click "+ New course" to build group courses with lessons, assignments, quizzes, and materials — organized by week. Students enroll and follow your curriculum.',
  },
  {
    targetId: 'tour-nav-students',
    placement: 'right',
    title: 'Step 4 — Manage Students',
    body: 'See everyone enrolled across your courses. View individual profiles, track progress and completion, and review recent submissions.',
  },
  {
    targetId: 'tour-nav-schedule',
    placement: 'right',
    title: 'Step 5 — Schedule Lessons',
    body: 'Manage upcoming lessons and individual booking requests here. Confirm or decline requests from students and add meeting links.',
  },
  {
    targetId: 'tour-nav-grading',
    placement: 'right',
    title: 'Step 6 — Assignments & Quizzes',
    body: 'Grade student assignment submissions — give scores (0–100) and written feedback. Inside each course you can also create and review quizzes.',
  },
  {
    targetId: 'tour-nav-messages',
    placement: 'right',
    title: 'Step 7 — Messages',
    body: 'Send and receive direct messages with your students. Share resources, answer questions, or announce upcoming sessions.',
  },
  {
    type: 'complete',
    title: "You're all set!",
    body: "You now know the key features of Tutofy LMS. Complete your profile, set your availability, and create your first course — your first student is just around the corner!",
  },
];

const SPOTLIGHT_STEPS = STEPS.filter((s) => !s.type);
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

  const GAP  = 16;
  const EST_H = 200;
  const vw   = window.innerWidth;
  const vh   = window.innerHeight;

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

/* ── Exported hook so other pages can trigger restart ── */
export function useTutorTour() {
  const [active, setActive] = useState(() => localStorage.getItem(LS_SEEN) !== 'true');

  const restart = useCallback(() => {
    localStorage.removeItem(LS_SEEN);
    localStorage.removeItem(LS_DONE);
    setActive(true);
  }, []);

  const dismiss = useCallback(() => setActive(false), []);

  return { active, restart, dismiss };
}

/* ── Main component ── */
export default function TutorTour({ onDismiss }) {
  const [step, setStep] = useState(0);
  const current  = STEPS[step];
  const rect     = useElementRect(current?.targetId);

  const isWelcome  = current?.type === 'welcome';
  const isComplete = current?.type === 'complete';
  const isModal    = isWelcome || isComplete;

  const spotlightIdx    = SPOTLIGHT_STEPS.findIndex((s) => s === current);
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
    setStep((s) => (s < STEPS.length - 1 ? s + 1 : s));
    if (step === STEPS.length - 1) handleDone();
  }, [step, handleDone]);

  const handleBack = useCallback(() => {
    setStep((s) => (s > 1 ? s - 1 : s));
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape')      handleSkip();
      if (e.key === 'ArrowRight')  handleNext();
      if (e.key === 'ArrowLeft')   handleBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleSkip, handleNext, handleBack]);

  const PAD   = 8;
  const vw    = typeof window !== 'undefined' ? window.innerWidth  : 1200;
  const vh    = typeof window !== 'undefined' ? window.innerHeight : 800;
  const sX    = rect ? rect.left  - PAD : 0;
  const sY    = rect ? rect.top   - PAD : 0;
  const sW    = rect ? rect.width  + PAD * 2 : 0;
  const sH    = rect ? rect.height + PAD * 2 : 0;

  /* ── Modal steps (welcome / complete) ── */
  if (isModal) {
    return createPortal(
      <>
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', zIndex: 9997 }} onClick={isComplete ? handleDone : undefined} />
        <div style={{
          position: 'fixed', zIndex: 9999,
          top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          background: 'white', borderRadius: 24,
          padding: '40px 36px 32px',
          width: 460, maxWidth: 'calc(100vw - 32px)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
          textAlign: 'center',
          animation: 'tour-modal-in 0.25s ease-out',
        }}>

          {isWelcome ? (
            <>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(13,148,136,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="1.8" width={32} height={32}>
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0c0d12', margin: '0 0 10px', letterSpacing: -0.5 }}>{current.title}</h2>
              <p style={{ fontSize: 14, color: '#6b6f7d', lineHeight: 1.65, margin: '0 auto 28px', maxWidth: 360 }}>{current.body}</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button
                  onClick={handleNext}
                  style={{ padding: '12px 28px', background: '#0d9488', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                >
                  Start Tour →
                </button>
                <button
                  onClick={handleSkip}
                  style={{ padding: '12px 20px', background: 'transparent', color: '#6b6f7d', border: '1px solid #d2d4d9', borderRadius: 12, fontSize: 14, cursor: 'pointer' }}
                >
                  Skip for Now
                </button>
              </div>
              <p style={{ fontSize: 11, color: '#b0b3bc', marginTop: 16 }}>You can restart this tour any time from your Profile page.</p>
            </>
          ) : (
            <>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width={32} height={32}>
                  <path d="M5 12l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0c0d12', margin: '0 0 10px', letterSpacing: -0.5 }}>{current.title}</h2>
              <p style={{ fontSize: 14, color: '#6b6f7d', lineHeight: 1.65, margin: '0 auto 28px', maxWidth: 380 }}>{current.body}</p>
              <button
                onClick={handleDone}
                style={{ padding: '12px 32px', background: '#0d9488', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                Let's go!
              </button>
            </>
          )}
        </div>

        <style>{`
          @keyframes tour-modal-in {
            from { opacity: 0; transform: translate(-50%, -47%) scale(0.96); }
            to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
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
      {/* Darkened overlay with spotlight cutout */}
      <svg
        style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 9997, pointerEvents: 'none' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id="tour-mask">
            <rect fill="white" x={0} y={0} width={vw} height={vh} />
            {rect && <rect fill="black" x={sX} y={sY} width={sW} height={sH} rx="10" />}
          </mask>
        </defs>
        <rect fill="rgba(0,0,0,0.52)" x={0} y={0} width={vw} height={vh} mask="url(#tour-mask)" />
        {rect && (
          <rect x={sX} y={sY} width={sW} height={sH} rx="10"
            fill="none" stroke="rgba(13,148,136,0.85)" strokeWidth="2.5" />
        )}
      </svg>

      {/* Click blockers around spotlight hole */}
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

      {/* Tooltip card */}
      <div style={{
        position: 'fixed',
        zIndex: 9999,
        width: TOOLTIP_W,
        background: 'white',
        borderRadius: 16,
        padding: '18px 18px 14px',
        boxShadow: '0 16px 48px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
        animation: 'tour-tooltip-in 0.2s ease-out',
        ...tooltipPos,
      }}>
        {/* Progress bar */}
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
              onClick={isLastSpotlight ? () => setStep((s) => s + 1) : handleNext}
              style={{ padding: '6px 15px', background: '#0d9488', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              {isLastSpotlight ? 'Finish →' : 'Next →'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes tour-tooltip-in {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>,
    document.body
  );
}
