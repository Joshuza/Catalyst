import { useEffect, useState } from 'react';
import artwork from '../../assets/oasis-nectarines.png';
import { ArtFrame } from './SurveyOrnaments';
import s from './onboarding.module.css';

export function SurveyScene({ progress }: { progress: number }) {
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const reveal = reduced
    ? 1
    : Math.max(0, Math.min(1, (progress - 0.12) / 0.76));
  const draw = Math.min(1, 0.18 + progress * 2.8);
  const phase =
    progress < 0.2
      ? 'THE VISION'
      : progress < 0.45
        ? 'THE FOUNDATION'
        : progress < 0.75
          ? 'TAKING SHAPE'
          : 'A PLACE OF YOUR OWN';
  return (
    <aside
      className={`${s.art} ${s.scene}`}
      aria-label="Your plans taking shape"
      data-scene-progress={progress.toFixed(3)}
    >
      <img
        src={artwork}
        className={s.sceneUnderpainting}
        alt=""
        aria-hidden="true"
      />
      <img
        src={artwork}
        className={s.scenePainting}
        style={{
          clipPath: `inset(${(1 - reveal) * 100}% 0 0 0)`,
          opacity: reduced ? 1 : 0.25 + reveal * 0.75,
        }}
        alt="Renaissance-style painting of artisans building a sandstone pavilion beside an Egyptian oasis, with ripe nectarines in the foreground."
        decoding="async"
      />
      <svg
        className={s.blueprint}
        viewBox="0 0 600 1000"
        aria-hidden="true"
        style={{ opacity: reduced ? 0 : 1 - reveal }}
      >
        <defs>
          <pattern
            id="catalyst-plan-grid"
            width="30"
            height="30"
            patternUnits="userSpaceOnUse"
          >
            <path d="M30 0H0V30" />
          </pattern>
        </defs>
        <rect
          className={s.planGrid}
          width="600"
          height="1000"
          fill="url(#catalyst-plan-grid)"
        />
        <g className={s.planLines}>
          <path
            pathLength="1"
            style={{ strokeDasharray: 1, strokeDashoffset: 1 - draw }}
            d="M68 620V342L310 222 544 337V612L306 758 68 620ZM68 342 306 471 544 337M306 471V758M68 342 185 210 310 222 430 189 544 337M185 210 306 337 430 189M306 337V471"
          />
          <path
            pathLength="1"
            style={{
              strokeDasharray: 1,
              strokeDashoffset:
                1 - Math.max(0, Math.min(1, progress * 3 - 0.2)),
            }}
            d="M98 632V421L142 443V658M164 671V456L210 479V698M240 716V495L278 515V738M332 735V517L374 491V709M410 687V470L453 445V661M484 641V427L520 405V620M70 385 306 515 542 382M70 413 306 544 542 410M50 774 306 916 558 766M50 810 306 950 558 803M306 916V950"
          />
        </g>
        <g className={s.planDimensions}>
          <path d="M40 630V300M32 300H48M32 630H48M74 818 290 938M70 806 78 830M286 926 294 950" />
          <text x="34" y="480" transform="rotate(-90 34 480)">
            ELEVATION / 01
          </text>
          <text x="106" y="889" transform="rotate(29 106 889)">
            A FOUNDATION FOR EVERYDAY
          </text>
          <text x="64" y="125">
            CATALYST · OASIS HOUSE
          </text>
          <text x="64" y="151">
            STUDY 01 / FROM IDEA TO REALITY
          </text>
        </g>
      </svg>
      <ArtFrame />
      <div className={s.artTop}>
        <span>CATALYST</span>
        <span>PERSONAL EDITION / 01</span>
      </div>
      <div className={s.artCaption}>
        <span className={s.micro}>{phase}</span>
        <p>
          Good things <br />
          take shape <br />
          <em>with care.</em>
        </p>
        <span className={s.micro}>SCROLL TO BUILD YOUR FOUNDATION ↓</span>
      </div>
    </aside>
  );
}
