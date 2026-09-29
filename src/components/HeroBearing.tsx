import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Play, Pause, ArrowUpRight } from 'lucide-react';
import { Language } from '../types';
import { HeroBearingScene, BearingFamily } from './HeroBearingScene';

interface HeroBearingProps {
  language: Language;
}

export const HeroBearing: React.FC<HeroBearingProps> = ({ language }) => {
  const fa = language === 'fa';
  const t = (en: string, faText: string) => (fa ? faText : en);

  const [family, setFamily] = useState<BearingFamily>('ball');
  const [exploded, setExploded] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false
  );
  const [visible, setVisible] = useState(true);
  const [tabVisible, setTabVisible] = useState(typeof document !== 'undefined' ? !document.hidden : true);

  const stage = useRef<HTMLDivElement>(null);

  const families: Array<{ id: BearingFamily; label: string; detail: string; caption: string }> = [
    {
      id: 'ball',
      label: t('Ball bearings', 'بلبرینگ‌ها'),
      detail: t('Deep groove ball bearing', 'بلبرینگ شیار عمیق'),
      caption: t('Single-row radial ball bearing with pressed cage', 'بلبرینگ شعاعی تک‌ردیفه با قفسه فولادی'),
    },
    {
      id: 'roller',
      label: t('Roller bearings', 'رولبرینگ‌ها'),
      detail: t('Double-row spherical roller bearing', 'رولبرینگ بشکه‌ای دو ردیفه'),
      caption: t('Two rows of barrel-shaped rollers', 'دو ردیف غلتک بشکه‌ای خودتنظیم'),
    },
    {
      id: 'accessories',
      label: t('Accessories', 'متعلقات بیرینگ'),
      detail: t('Adapter sleeve, locknut and washer', 'بوش تبدیلی، مهره قفلی و واشر'),
      caption: t('Mounting components shown as an illustrative assembly', 'اجزای نصب و مونتاژ شفت و بیرینگ'),
    },
    {
      id: 'engineered',
      label: t('Engineered units', 'محصولات مهندسی'),
      detail: t('Housed bearing unit', 'واحد بیرینگ محفظه‌دار'),
      caption: t('Bearing insert within a mounted casting housing', 'بیرینگ داخلی درون پوسته و محفظه چدنی'),
    },
    {
      id: 'track',
      label: t('Track rollers', 'رولرهای مسیر'),
      detail: t('Stud-type track roller', 'رولر مسیر پایه‌دار'),
      caption: t('Cam follower with fixed stud and rotating outer ring', 'رولر پیرو بادامک با پایه ثابت و رینگ گردان'),
    },
  ];

  const bearingParts = [
    t('Outer ring', 'رینگ خارجی'),
    t('Rolling elements', 'اجزای غلتشی'),
    t('Cage', 'قفسه'),
    t('Inner ring', 'رینگ داخلی'),
  ];

  const partLabels =
    family === 'accessories'
      ? [t('Adapter sleeve', 'بوش تبدیلی'), t('Locknut', 'مهره قفلی'), t('Lock washer', 'واشر قفلی'), t('Shaft seat', 'نشیمن شفت')]
      : family === 'engineered'
      ? [t('Housing', 'محفظه'), t('Bearing insert', 'بیرینگ داخلی'), t('Mounting bolts', 'پیچ‌های نصب'), t('Shaft seat', 'نشیمن شفت')]
      : family === 'track'
      ? [t('Outer roller', 'رولر بیرونی'), t('Needle rollers', 'غلتک‌های سوزنی'), t('End washer', 'واشر انتهایی'), t('Stud', 'پایه')]
      : bearingParts;

  const selected = families.find((f) => f.id === family) || families[0];
  const stopped = paused || reduced || !visible || !tabVisible;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motion = () => setReduced(media.matches);
    const visibility = () => setTabVisible(!document.hidden);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.1 });
    if (stage.current) observer.observe(stage.current);
    media.addEventListener('change', motion);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      observer.disconnect();
      media.removeEventListener('change', motion);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);

  const resetTilt = () => {
    stage.current?.style.setProperty('--tilt-x', '0deg');
    stage.current?.style.setProperty('--tilt-y', '0deg');
  };

  return (
    <div className={'hero-visual hero-bearing-showcase' + (stopped ? ' is-still' : '')}>
      {/* Top Header Badge */}
      <div className="hero-bearing-heading">
        <span>
          <i aria-hidden="true" />
          {t('PRECISION IN MOTION', 'دقت در حرکت')}
        </span>
        <span dir="ltr">
          {String(families.findIndex((f) => f.id === family) + 1).padStart(2, '0')} /{' '}
          {String(families.length).padStart(2, '0')}
        </span>
      </div>

      {/* Family Selector Pills */}
      <div className="hero-bearing-selector" role="group" aria-label={t('Bearing family', 'خانواده بیرینگ')}>
        {families.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={family === f.id}
            onClick={() => {
              setFamily(f.id);
              resetTilt();
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Assembly vs Exploded Switch */}
      <div className="bearing-view-switch" role="group" aria-label={t('Bearing assembly view', 'نمای مونتاژ بیرینگ')}>
        <button type="button" aria-pressed={!exploded} onClick={() => setExploded(false)}>
          {t('Assembled', 'مونتاژشده')}
        </button>
        <button type="button" aria-pressed={exploded} onClick={() => setExploded(true)}>
          {t('Exploded view', 'نمای انفجاری')}
        </button>
      </div>

      {/* 3D Stage with Tilt Tracking */}
      <div
        className="hero-bearing-stage"
        ref={stage}
        tabIndex={0}
        role="img"
        aria-label={t('Bearing view. Use arrow keys to adjust angle.', 'نمای بیرینگ. با کلیدهای جهتی زاویه را تنظیم کنید.')}
        onPointerMove={(e) => {
          if (e.pointerType !== 'mouse' || stopped) return;
          const rect = e.currentTarget.getBoundingClientRect();
          e.currentTarget.style.setProperty('--tilt-x', ((0.5 - (e.clientY - rect.top) / rect.height) * 10) + 'deg');
          e.currentTarget.style.setProperty('--tilt-y', (((e.clientX - rect.left) / rect.width - 0.5) * 14) + 'deg');
        }}
        onPointerLeave={resetTilt}
        onKeyDown={(e) => {
          if (stopped) return;
          const step = 4;
          const currentX = Number.parseFloat(getComputedStyle(e.currentTarget).getPropertyValue('--tilt-x')) || 0;
          const currentY = Number.parseFloat(getComputedStyle(e.currentTarget).getPropertyValue('--tilt-y')) || 0;
          switch (e.key) {
            case 'ArrowUp':
              e.currentTarget.style.setProperty('--tilt-x', `${Math.min(currentX + step, 12)}deg`);
              break;
            case 'ArrowDown':
              e.currentTarget.style.setProperty('--tilt-x', `${Math.max(currentX - step, -12)}deg`);
              break;
            case 'ArrowLeft':
              e.currentTarget.style.setProperty('--tilt-y', `${Math.max(currentY - step, -14)}deg`);
              break;
            case 'ArrowRight':
              e.currentTarget.style.setProperty('--tilt-y', `${Math.min(currentY + step, 14)}deg`);
              break;
            default:
              return;
          }
          e.preventDefault();
        }}
      >
        <div className="hero-bearing-halo" aria-hidden="true" />
        <div className="hero-bearing-orbit" aria-hidden="true" />
        <div className="hero-bearing-tilt hero-bearing-model">
          <Suspense
            fallback={
              <div className="hero-model-loading">
                {t('Preparing bearing view…', 'آماده‌سازی نمای سه‌بعدی بیرینگ…')}
              </div>
            }
          >
            <HeroBearingScene
              family={family}
              paused={stopped}
              exploded={exploded}
              reducedMotion={reduced}
              partLabels={partLabels}
              label={selected.detail + (exploded ? ' · ' + t('Exploded view', 'نمای انفجاری') : '')}
              fallback={
                <div className="hero-model-loading">
                  {selected.detail}
                  <small>{t('3D view unavailable on this device', 'نمای سه‌بعدی در این دستگاه در دسترس نیست')}</small>
                </div>
              }
            />
          </Suspense>
        </div>
        <span className="hero-bearing-caption">
          {t('Interactive 3D model · ISO geometry', 'مدل سه‌بعدی تعاملی · هندسه استاندارد ISO')}
        </span>
      </div>

      {/* Exploded Numbered Key */}
      {exploded && (
        <div className="bearing-parts-key" aria-label={t('Bearing parts', 'اجزای بیرینگ')}>
          {partLabels.map((name, i) => (
            <span key={name}>
              <b>{i + 1}</b>
              {name}
            </span>
          ))}
        </div>
      )}

      {/* Footer Controls */}
      <div className="hero-bearing-footer">
        <div aria-live="polite">
          <small>{selected.caption}</small>
          <strong>{selected.detail}</strong>
        </div>
        <div className="hero-bearing-actions">
          <button
            type="button"
            aria-label={t(stopped ? 'Play animation' : 'Pause animation', stopped ? 'شروع حرکت بیرینگ' : 'توقف حرکت بیرینگ')}
            title={t(stopped ? 'Play animation' : 'Pause animation', stopped ? 'شروع حرکت بیرینگ' : 'توقف حرکت بیرینگ')}
            onClick={() => {
              if (reduced) setReduced(false);
              setPaused(!stopped);
              resetTilt();
            }}
          >
            {stopped ? <Play size={16} /> : <Pause size={16} />}
          </button>
          <a
            href="#catalog"
            aria-label={t('Explore bearing catalog', 'کاوش کاتالوگ بیرینگ')}
            title={t('Explore bearing catalog', 'کاوش کاتالوگ بیرینگ')}
          >
            <ArrowUpRight size={20} />
          </a>
        </div>
      </div>
    </div>
  );
};
export default HeroBearing;
