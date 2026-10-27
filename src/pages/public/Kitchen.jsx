import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAsync } from '../../components/common';
import { DishArt, DishImage, Ingredient } from '../../components/kitchen/DishArt';
import Seo from '../../components/Seo';
import { Spinner } from '../../components/ui';
import { SITE } from '../../config/site';
import { useAuth } from '../../context/AuthContext';
import { kitchenApi } from '../../services/api';
import { naira } from '../../utils/format';
import { currentBand, fmtClock, toMinutes } from '../../utils/kitchen';

const TICKER = ['Smoky party jollof', 'Egusi', 'Efo riro', 'Ofada & ayamase', 'Goat meat pepper soup', 'Asun', 'Moi moi', 'Dodo', 'Small chops', 'Pounded yam', 'Banga', 'Peppered chicken', 'Akara', 'Chin chin'];

const FAQ = [
  ['Can I really ask for no garlic, no ginger or no seasoning cubes?', 'Yes. Every dish shows what Jojo can leave out — tick it when you order and it goes straight onto her cooking sheet. For allergies, tell us in the allergy box too so she takes extra care with utensils and oil.'],
  ['Do you have a restaurant I can visit?', 'No — Jojo’s Kitchen is delivery only. Food is cooked fresh for your order in a clean home kitchen and delivered sealed to your door.'],
  ['Why can’t I pick tomorrow morning?', 'Jojo buys fresh ingredients and cooks for each order, so she needs notice. Order before 10am for next-day delivery; between 10am and noon, next-day from late afternoon; after noon, the day after tomorrow. Need it sooner? Request Express.'],
  ['What is Express?', 'You choose the exact delivery time. We pass it to Jojo, she confirms whether she can make it (usually within a few hours), and only then do you pay. Express costs more because it jumps the queue.'],
  ['Can you cook for a party?', 'Yes — coolers of jollof and fried rice, soup buckets, small chops boxes and party packs. Bulk orders need an extra day of notice, and Jojo limits how many she takes each day so every pot gets her full attention.'],
  ['What if a day is fully booked?', 'It simply won’t appear as an option. Jojo caps how much she cooks each day so quality never slips — pick the next open day, or ask about Express.'],
];

export default function Kitchen() {
  const { user } = useAuth();
  const { data, loading } = useAsync(() => kitchenApi.menu(), []);
  const [cat, setCat] = useState('all');
  const orderTo = user?.role === 'customer' || !user ? '/app/kitchen/new' : '/admin/kitchen';

  const meals = data?.meals || [];
  const shown = cat === 'all' ? meals : meals.filter((m) => m.category === cat);
  const usedCats = (data?.categories || []).filter((c) => meals.some((m) => m.category === c.key));
  const rules = data?.rules;
  const band = rules ? currentBand(rules) : null;
  const firstWindowAfter = useMemo(() => {
    if (!rules) return null;
    const plus = toMinutes(rules.fullDayCutoff) + rules.extraHours * 60;
    return fmtClock(plus);
  }, [rules]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FoodEstablishment',
    name: 'Jojo’s Kitchen by Jojo Market',
    servesCuisine: 'Nigerian',
    areaServed: 'Lagos',
    url: `${SITE.url}/kitchen`,
    hasMenu: meals.length ? { '@type': 'Menu', hasMenuSection: usedCats.map((c) => ({ '@type': 'MenuSection', name: c.label, hasMenuItem: meals.filter((m) => m.category === c.key).map((m) => ({ '@type': 'MenuItem', name: m.name, description: m.description, offers: { '@type': 'Offer', price: m.priceFrom, priceCurrency: 'NGN' } })) })) } : undefined,
  };

  return (
    <div className="kitchen">
      <Seo
        title="Jojo’s Kitchen — home-cooked Nigerian food delivered in Lagos"
        description="Jollof, egusi, efo riro, ofada, pepper soup, small chops and party trays — cooked fresh to order, your way (no garlic, no ginger, low salt…), and delivered across Lagos."
        jsonLd={jsonLd}
      />

      {/* ---------- Hero ---------- */}
      <section className="k-hero">
        <div className="k-hero__pattern" aria-hidden="true" />
        <div className="container k-hero__grid">
          <div className="k-hero__copy">
            <p className="k-eyebrow">Jojo’s Kitchen · Delivery only · Lagos</p>
            <h1 className="k-hero__title">Home-cooked Nigerian food, <span className="k-swash">made just for you.</span></h1>
            <p className="k-hero__lead">
              Smoky party jollof, rich egusi, ofada with ayamase, peppery asun — cooked fresh for your order in a clean, private kitchen.
              No garlic? No ginger? Less oil? Just say so.
            </p>
            <div className="k-hero__ctas">
              <Link to={orderTo} className="btn btn--accent btn--lg">Order food</Link>
              <a href="#menu" className="btn btn--lg k-btn-light">See the menu</a>
            </div>
            <ul className="k-hero__ticks">
              <li>Cooked to order</li><li>Your ingredients, your way</li><li>Party &amp; bulk orders</li>
            </ul>
          </div>
          <div className="k-hero__visual" aria-hidden="true">
            <div className="k-hero__glow" />
            <DishArt dish="egusi" className="k-hero__dish k-hero__dish--back" />
            <DishArt dish="poundo" className="k-hero__dish k-hero__dish--side" />
            <DishArt dish="jollof" steam className="k-hero__dish k-hero__dish--main" />
            <DishArt dish="dodo" className="k-hero__dish k-hero__dish--small" />
            <Ingredient kind="pepper" className="k-float k-float--1" />
            <Ingredient kind="tomato" className="k-float k-float--2" />
            <Ingredient kind="leaf" className="k-float k-float--3" />
            <Ingredient kind="yellowpepper" className="k-float k-float--4" />
            <Ingredient kind="onion" className="k-float k-float--5" />
            <span className="k-sticker">Fresh<br />today</span>
          </div>
        </div>
      </section>

      <div className="k-ticker" aria-hidden="true">
        <div className="k-ticker__track">
          {[...TICKER, ...TICKER].map((t, i) => <span key={i}>{t}<b>✺</b></span>)}
        </div>
      </div>

      {/* ---------- Pillars ---------- */}
      <section className="section k-pillars">
        <div className="container">
          <div className="k-pillars__grid">
            <article className="k-pillar">
              <span className="k-pillar__icon">🍲</span>
              <h2>Cooked to order</h2>
              <p>Nothing sits in a warmer. Jojo shops and cooks for your delivery day, so it arrives tasting like it came off the fire.</p>
            </article>
            <article className="k-pillar k-pillar--orange">
              <span className="k-pillar__icon">✋</span>
              <h2>Your pot, your rules</h2>
              <p>Tell us what to leave out and how hot you like it. It goes straight onto Jojo’s cooking sheet.</p>
              <div className="k-chips">
                {['No garlic', 'No ginger', 'No Maggi', 'Less oil', 'Low salt', 'No crayfish', 'Mild pepper'].map((c) => <span key={c} className="k-chip">{c}</span>)}
              </div>
            </article>
            <article className="k-pillar">
              <span className="k-pillar__icon">🧼</span>
              <h2>Clean &amp; private</h2>
              <p>A clean home kitchen, hair covered, hands washed, food sealed for delivery. Your address and order are seen by Jojo only.</p>
            </article>
          </div>
        </div>
      </section>

      {/* ---------- Menu ---------- */}
      <section className="section k-menu" id="menu">
        <div className="container">
          <header className="section__head">
            <p className="k-eyebrow k-eyebrow--dark">The menu</p>
            <h2 className="section__title">What’s cooking?</h2>
            <p className="section__lead">Sample prices — the price you see when you order is the price you pay, plus delivery.</p>
          </header>
          {loading && <Spinner label="Loading the menu" />}
          {!!usedCats.length && (
            <div className="k-cats" role="tablist" aria-label="Menu sections">
              <button role="tab" aria-selected={cat === 'all'} className={cat === 'all' ? 'is-on' : ''} onClick={() => setCat('all')}>Everything</button>
              {usedCats.map((c) => <button key={c.key} role="tab" aria-selected={cat === c.key} className={cat === c.key ? 'is-on' : ''} onClick={() => setCat(c.key)}>{c.label}</button>)}
            </div>
          )}
          <div className="k-grid">
            {shown.map((m) => <DishCard key={m.id} meal={m} to={`${orderTo}?dish=${m.slug}`} />)}
          </div>
          {data && !meals.length && <p className="muted center">The menu is being updated — check back soon.</p>}
        </div>
      </section>

      {/* ---------- Timing ---------- */}
      {rules && (
        <section className="section k-time">
          <div className="container">
            <header className="section__head">
              <p className="k-eyebrow k-eyebrow--dark">When can it arrive?</p>
              <h2 className="section__title">Good food needs a little notice</h2>
              <p className="section__lead">Jojo buys fresh ingredients for every order. Here’s how the ordering time decides your earliest delivery (Lagos time).</p>
            </header>
            <div className="k-time__grid">
              <article className={`k-time__card${band === 'early' ? ' is-now' : ''}`}>
                {band === 'early' && <span className="k-now">You’re here now</span>}
                <p className="k-time__when">Order before {fmtClock(toMinutes(rules.fullDayCutoff))}</p>
                <h3>Tomorrow</h3>
                <p>Any delivery window tomorrow — morning, afternoon or evening.</p>
              </article>
              <article className={`k-time__card${band === 'late_morning' ? ' is-now' : ''}`}>
                {band === 'late_morning' && <span className="k-now">You’re here now</span>}
                <p className="k-time__when">{fmtClock(toMinutes(rules.fullDayCutoff))} – {fmtClock(toMinutes(rules.extraHoursCutoff) - 1)}</p>
                <h3>Tomorrow, later</h3>
                <p>24 hours plus {rules.extraHours} — delivery tomorrow from about {firstWindowAfter}.</p>
              </article>
              <article className={`k-time__card${band === 'afternoon' ? ' is-now' : ''}`}>
                {band === 'afternoon' && <span className="k-now">You’re here now</span>}
                <p className="k-time__when">From {fmtClock(toMinutes(rules.extraHoursCutoff))}</p>
                <h3>Day after tomorrow</h3>
                <p>Gives Jojo a full day to shop at the market and cook properly.</p>
              </article>
            </div>
            <p className="k-time__note">
              🎉 <strong>Party &amp; bulk orders</strong> (party coolers, buckets, or {rules.bulkPortionThreshold}+ portions) need {rules.bulkExtraDays} extra day{rules.bulkExtraDays > 1 ? 's' : ''}.
              Fully booked days don’t show up — Jojo never takes on more than she can cook well.
            </p>
          </div>
        </section>
      )}

      {/* ---------- Express ---------- */}
      {rules?.expressEnabled && (
        <section className="k-express">
          <div className="container k-express__grid">
            <div>
              <p className="k-eyebrow">Express</p>
              <h2>Need it at a particular time?</h2>
              <p>Choose your exact delivery time (from {rules.expressMinHoursAhead} hours ahead, {fmtClock(toMinutes(rules.expressEarliestTime))}–{fmtClock(toMinutes(rules.expressLatestTime))}).
                We get across to Jojo, she confirms, and only then do you pay. Express adds {rules.expressSurchargePercent}% (min {naira(rules.expressMinFee)}).</p>
              <Link to={`${orderTo}?express=1`} className="btn btn--gold btn--lg">Request Express</Link>
            </div>
            <ol className="k-express__steps">
              <li><b>1</b><span><strong>Tell us when</strong> Pick the food, quantity and the time you want it.</span></li>
              <li><b>2</b><span><strong>Jojo confirms</strong> You get an email: “Your express request has been approved”.</span></li>
              <li><b>3</b><span><strong>Pay &amp; relax</strong> Track it from preparing to cooking to your door.</span></li>
            </ol>
          </div>
        </section>
      )}

      {/* ---------- Party ---------- */}
      <section className="section k-party">
        <div className="container k-party__grid">
          <div className="k-party__art" aria-hidden="true">
            <DishArt dish="partypack" className="k-party__a" />
            <DishArt dish="smallchops" className="k-party__b" />
            <DishArt dish="chicken" className="k-party__c" />
          </div>
          <div>
            <p className="k-eyebrow k-eyebrow--dark">Owambe-ready</p>
            <h2 className="section__title">Cooking for a crowd?</h2>
            <p className="section__lead">Birthdays, naming ceremonies, office lunches, Sunday family gatherings. Order coolers of jollof, soup by the bucket, small chops boxes and sealed party packs — all made the same careful way.</p>
            <ul className="k-list">
              <li>Party coolers that serve 20–25</li>
              <li>Party packs for 25, 50 or 100 guests</li>
              <li>Small chops boxes for 20 or 50</li>
            </ul>
            <Link to={orderTo} className="btn btn--primary btn--lg">Plan a party order</Link>
          </div>
        </div>
      </section>

      {/* ---------- Tracking ---------- */}
      <section className="section k-track">
        <div className="container">
          <header className="section__head">
            <p className="k-eyebrow k-eyebrow--dark">After you pay</p>
            <h2 className="section__title">Watch it come together</h2>
          </header>
          <ol className="k-track__steps">
            <li><span>🔪</span><strong>Preparing</strong><small>Fresh ingredients bought and prepped</small></li>
            <li><span>🍲</span><strong>Cooking</strong><small>On the fire, your way</small></li>
            <li><span>🛵</span><strong>On the way</strong><small>Sealed and heading to you</small></li>
            <li><span>🏠</span><strong>Delivered</strong><small>Enjoy — and tell us how it was</small></li>
          </ol>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="section section--tint">
        <div className="container faq">
          <h2 className="section__title center">Questions about Jojo’s Kitchen</h2>
          {FAQ.map(([q, a]) => <details key={q} className="faq__item"><summary>{q}</summary><p>{a}</p></details>)}
        </div>
      </section>

      <section className="k-cta">
        <div className="container k-cta__inner">
          <DishArt dish="ofada" className="k-cta__dish" />
          <div>
            <h2>Hungry already?</h2>
            <p>Pick your dishes, tell Jojo how you like them, and choose a delivery day.</p>
            <Link to={orderTo} className="btn btn--accent btn--lg">Start my order</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export function DishCard({ meal, to, onAdd, compact = false }) {
  const bulk = meal.options.some((o) => o.isBulk);
  const body = (
    <>
      <div className={`k-card__art k-bg--${meal.category}`}>
        <div className="k-card__rays" aria-hidden="true" />
        <DishImage meal={meal} className="k-card__img" />
        <div className="k-card__tags">
          {meal.featured && <span className="k-tag k-tag--gold">Jojo’s pick</span>}
          {bulk && <span className="k-tag">Party size</span>}
        </div>
      </div>
      <div className="k-card__body">
        <h3>{meal.name}</h3>
        {!compact && meal.description && <p className="k-card__desc">{meal.description}</p>}
        <p className="k-card__sizes">{meal.options.map((o) => `${o.label} ${naira(o.price)}`).join(' · ')}</p>
        <div className="k-card__foot">
          <span className="k-card__from"><small>from</small> {naira(meal.priceFrom)}</span>
          <span className="btn btn--accent btn--sm">{onAdd ? 'Add' : 'Order'}</span>
        </div>
      </div>
    </>
  );
  if (onAdd) return <button type="button" className="k-card" onClick={() => onAdd(meal)}>{body}</button>;
  return <Link to={to} className="k-card">{body}</Link>;
}
