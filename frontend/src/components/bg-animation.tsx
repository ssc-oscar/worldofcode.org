import '@/styles/bg-animation.css';
import { cn } from '@/lib/utils';
import { useTheme } from '@/providers/theme-provider';

export default function WaveBackground({
  color = '#0f172a',
  darkColor = '#cbd5e1'
}) {
  const { resolvedTheme } = useTheme();
  const resolvedColor = resolvedTheme === 'dark' ? darkColor : color;
  return (
    <>
      <div className="waves">
        <svg
          className="waves"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          viewBox="0 24 150 28"
          preserveAspectRatio="none"
          shapeRendering="auto"
        >
          <defs>
            <path
              id="gentle-wave"
              d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z"
            />
          </defs>
          <g className="parallax">
            <use
              xlinkHref="#gentle-wave"
              x="48"
              y="0"
              fill={resolvedColor}
              opacity="0.7"
            />
            <use
              xlinkHref="#gentle-wave"
              x="48"
              y="3"
              fill={resolvedColor}
              opacity="0.5"
            />
            <use
              xlinkHref="#gentle-wave"
              x="48"
              y="5"
              fill={resolvedColor}
              opacity="0.3"
            />
            <use xlinkHref="#gentle-wave" x="48" y="7" fill={resolvedColor} />
          </g>
        </svg>
      </div>
      {/* <div className="copyright flex pl-2 text-sm">
        &copy; 2021-2024 World of Code authors. &nbsp;
        <a
          href="https://github.com/woc-hack/tutorial/raw/refs/heads/master/LICENSE"
          className="underline"
          target="_blank"
        >
          License
        </a>{' '}
        &nbsp; applies.
      </div> */}
    </>
  );
}
