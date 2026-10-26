import { Link } from 'react-router-dom';

/** Brand lockup: illustration mark + live-text wordmark (crisp at any size, readable by search engines). */
export default function Logo({ to = '/', size = 'md', showMark = true, inverse = false }) {
  return (
    <Link to={to} className={`logo logo--${size}${inverse ? ' logo--inverse' : ''}`} aria-label="Jojo Market home">
      {showMark && (
        <img src="/brand/jojo-mark.webp" alt="" width="450" height="330" className="logo__mark" decoding="async" />
      )}
      <span className="logo__word" aria-hidden="true">
        <span className="logo__jojo">jojo</span>
        <span className="logo__market">market</span>
      </span>
    </Link>
  );
}
