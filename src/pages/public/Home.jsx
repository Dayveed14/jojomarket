import { Link } from 'react-router-dom';
import { DishArt } from '../../components/kitchen/DishArt';
import Seo from '../../components/Seo';
import { SITE } from '../../config/site';
import { homeFor, useAuth } from '../../context/AuthContext';

const STEPS = [
  { n: '1', title: 'Pick a market, build your list', body: 'Mile 12 for foodstuff, Balogun for fabric. Choose a basket of tomatoes at the listed price — or just say “₦7,000 of tomatoes”.' },
  { n: '2', title: 'Set your budget and limit', body: 'Your target spend and the most we may spend without asking are two separate numbers. We never cross the limit.' },
  { n: '3', title: 'Jojo reviews, then you pay', body: 'She checks the date, market and list, then sends a clear quote — goods, service fee and transport. You pay only after you accept.' },
  { n: '4', title: 'We shop, you get receipts', body: 'Every item, price and substitution is recorded. Leftover money is refunded or credited — never quietly kept.' },
];

const CATEGORIES = [
  { emoji: '🍅', label: 'Fresh vegetables' },
  { emoji: '🌶️', label: 'Pepper & spices' },
  { emoji: '🍚', label: 'Rice & grains' },
  { emoji: '🫘', label: 'Beans & legumes' },
  { emoji: '🐟', label: 'Fish & proteins' },
  { emoji: '🧵', label: 'Fabric & Ankara' },
  { emoji: '👗', label: 'Clothing' },
  { emoji: '🪣', label: 'Plastics' },
  { emoji: '🧺', label: 'Household goods' },
];

const FAQS = [
  {
    q: 'Do I have to buy a whole basket or bag?',
    a: 'No. Where an item has a standard unit — like a basket of tomatoes — you’ll see its price and can order by quantity. Or just enter an amount, like ₦7,000 of tomatoes, and Jojo buys what that money gets on the day. Items without a fixed price, like ugwu or spices, are always bought by amount.',
  },
  {
    q: 'Are the prices on my estimate final?',
    a: 'No. Market prices move daily, so every figure before shopping is an estimate. After the shop you get the actual prices from the market, and we reconcile against what you paid.',
  },
  {
    q: 'What if something costs more than I expected?',
    a: 'You set an authorised spending limit. If goods would cost more than that, Jojo pauses and asks you first. Nothing is bought above your limit without your approval.',
  },
  {
    q: 'What is a sample run?',
    a: 'A smaller paid trip where Jojo checks prices, quality, colours or sizes — with photos or samples — so you can decide before committing to a full shop. If you go ahead, it becomes a new, linked booking.',
  },
  {
    q: 'What happens to leftover money?',
    a: 'If the shop costs less than you paid, the difference is refunded or held as credit under our published policy. You see the full breakdown either way.',
  },
  {
    q: 'Will you remind me when I’m running low?',
    a: 'If you’d like. After each shop we estimate when staples like rice, beans or oil may run out — based on what you bought and, if you tell us, your household size — and send a gentle email. You can say “still have some” and we adjust. It’s an estimate, not a stock count.',
  },
  {
    q: 'Who sees my address?',
    a: 'Only Jojo, and only to deliver your shopping. Your addresses and purchase history are private to your account.',
  },
];

export default function Home() {
  const { user } = useAuth();
  const ctaTo = user ? homeFor(user) : '/register';

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Jojo Market — personal market shopping',
      serviceType: 'Personal shopping from traditional markets',
      provider: { '@type': 'LocalBusiness', name: SITE.name, url: SITE.url, logo: `${SITE.url}/brand/icon-512.png`, image: `${SITE.url}${SITE.ogImage}`, address: { '@type': 'PostalAddress', addressLocality: SITE.city, addressCountry: 'NG' } },
      areaServed: { '@type': 'City', name: SITE.city },
      description: SITE.description,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ];

  return (
    <>
      <Seo
        title={`Personal market shopper in ${SITE.city}`}
        description={`Book a trusted shopper to buy foodstuff, fabric and household goods from ${SITE.city}'s traditional markets. Honest estimates, itemised receipts, no surprise spending.`}
        jsonLd={jsonLd}
      />

      {/* HERO */}
      <section className="hero">
        <div className="container hero__grid">
          <div className="hero__copy">
            <p className="eyebrow">Personal market shopping · {SITE.city}</p>
            <h1 className="hero__title">
              Your market list,<br />
              <span className="hl-orange">shopped by someone</span><br />
              you trust.
            </h1>
            <p className="hero__lead">
              Skip the traffic, the haggling and the heat. Jojo buys your foodstuff, fabric and household goods from the
              market — the way you like them — and shows you every naira spent.
            </p>
            <div className="hero__ctas">
              <Link to={ctaTo} className="btn btn--accent btn--lg">{user ? 'Go to my dashboard' : 'Book a shopper'}</Link>
              <a href="#how-it-works" className="btn btn--ghost btn--lg">How it works</a>
            </div>
            <ul className="hero__ticks">
              <li>No spending past your limit</li>
              <li>Itemised receipts</li>
              <li>Sample runs available</li>
            </ul>
          </div>

          <div className="hero__visual">
            <div className="hero__sun" aria-hidden="true" />
            <img
              src="/brand/jojo-mark.webp"
              alt="Illustration of Jojo, a smiling market shopper in a green headwrap carrying a basket of fresh vegetables"
              width="450" height="330" fetchPriority="high" className="hero__img"
            />
            <div className="receipt" aria-label="Example estimate">
              <div className="receipt__head">
                <span>Example estimate</span>
                <span className="receipt__tag">Illustrative</span>
              </div>
              <ul>
                <li><span>Tomatoes · 1 basket</span><span>₦20,000</span></li>
                <li><span>Rodo · ₦7,000 worth</span><span>₦7,000</span></li>
                <li><span>Onions · ₦5,000 worth</span><span>₦5,000</span></li>
                <li><span>Rice · 1 bag (local)</span><span>₦70–85k</span></li>
                <li><span>Ugwu · ₦1,500 worth</span><span>₦1,500</span></li>
              </ul>
              <div className="receipt__total"><span>Goods budget</span><strong>₦118,500</strong></div>
              <div className="receipt__limit"><span>Authorised limit</span><strong>₦125,000</strong></div>
              <p className="receipt__note">Service fee &amp; transport shown separately</p>
            </div>
          </div>
        </div>
        <div className="hero__wave" aria-hidden="true" />
      </section>

      {/* PROMISES */}
      <section className="promises" aria-label="Our promises">
        <div className="container promises__grid">
          <div className="promise">
            <span className="promise__icon" aria-hidden="true">🛡️</span>
            <div><h2>No silent overspending</h2><p>Above your limit? We stop and ask.</p></div>
          </div>
          <div className="promise">
            <span className="promise__icon" aria-hidden="true">🧾</span>
            <div><h2>Every naira accounted for</h2><p>Actual prices, receipts and photos.</p></div>
          </div>
          <div className="promise">
            <span className="promise__icon" aria-hidden="true">🔒</span>
            <div><h2>Private by default</h2><p>Your address and history stay yours.</p></div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="section">
        <div className="container">
          <header className="section__head">
            <p className="eyebrow">How it works</p>
            <h2 className="section__title">From your list to your door in four steps</h2>
          </header>
          <ol className="steps">
            {STEPS.map((s) => (
              <li key={s.n} className="step">
                <span className="step__n" aria-hidden="true">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="section section--tint">
        <div className="container">
          <header className="section__head">
            <p className="eyebrow">Two ways to book</p>
            <h2 className="section__title">Shop it all, or see it first</h2>
          </header>
          <div className="services">
            <article className="service service--green">
              <span className="service__label">Most popular</span>
              <h3>Full shopping</h3>
              <p>Send your whole list. Jojo buys everything within your limit, records the actual prices and delivers to your address.</p>
              <ul>
                <li>Quantity, budget or “a basket’s worth” — your choice per item</li>
                <li>Substitutions only with your say-so</li>
                <li>Final reconciliation with refund or credit</li>
              </ul>
              <Link to={ctaTo} className="btn btn--gold">Plan a full shop</Link>
            </article>
            <article className="service service--cream">
              <span className="service__label service__label--orange">Try before you buy</span>
              <h3>Sample run</h3>
              <p>Not sure about a fabric, a rice brand or this week’s prices? Jojo checks the market and sends photos, prices and notes.</p>
              <ul>
                <li>Great for Ankara, lace and clothing</li>
                <li>Clear sample fee, quoted upfront</li>
                <li>Turn it into a full shop when you’re ready</li>
              </ul>
              <Link to={ctaTo} className="btn btn--primary">Request a sample run</Link>
            </article>
          </div>
        </div>
      </section>

      {/* WHAT WE BUY */}
      <section id="what-we-buy" className="section">
        <div className="container">
          <header className="section__head">
            <p className="eyebrow">What we buy</p>
            <h2 className="section__title">If it’s sold in the market, we can get it</h2>
            <p className="section__lead">Foodstuff for the week, fabric for an occasion, buckets and bowls for the house.</p>
          </header>
          <ul className="chips">
            {CATEGORIES.map((c) => (
              <li key={c.label} className="chip"><span aria-hidden="true">{c.emoji}</span>{c.label}</li>
            ))}
          </ul>
        </div>
      </section>


      {/* MARKETS */}
      <section className="section section--tint">
        <div className="container">
          <header className="section__head">
            <p className="eyebrow">Lagos markets</p>
            <h2 className="section__title">The right market for the right things</h2>
            <p className="section__lead">Choose the market when you book — Jojo knows where the good stalls are.</p>
          </header>
          <ul className="lagos-markets">
            {[
              ['Mile 12', 'Tomatoes, pepper, onions, yams — by the basket and bag'],
              ['Oyingbo', 'Foodstuff, grains, oils and everyday household items'],
              ['Balogun', 'Ankara, lace, Aso-oke, clothing and shoes'],
              ['Idumota', 'Clothing, plastics and general goods'],
              ['Jankara', 'Pots, plastics, containers and traditional items'],
              ['Tejuosho', 'Clothing, materials and household items'],
              ['Ajah', 'Foodstuff and household shopping on the Lekki side'],
            ].map(([n, d]) => <li key={n}><strong>{n}</strong><span>{d}</span></li>)}
          </ul>
          <p className="center"><Link to="/markets" className="btn btn--ghost">See all markets &amp; opening days</Link></p>
        </div>
      </section>

      {/* RESTOCK */}
      <section className="section">
        <div className="container restock-promo">
          <div>
            <p className="eyebrow">Never caught short</p>
            <h2 className="section__title">A gentle nudge before the rice runs out</h2>
            <p className="section__lead">
              After each shop, Jojo Market estimates when your staples may be running low — a bag of rice for a family of four,
              a keg of palm oil — and can email you a reminder. Tell us “still have some” and we’ll adjust. It’s a helpful guess,
              never a stock count.
            </p>
            <Link to={ctaTo} className="btn btn--primary">{user ? 'See my restocking' : 'Create my account'}</Link>
          </div>
          <ul className="restock-demo" aria-hidden="true">
            <li><span>🍚 Rice · Bag (50kg)</span><span className="gauge"><span style={{ width: '22%' }} /></span><em>About 12 days left</em></li>
            <li><span>🫙 Palm oil · 4L</span><span className="gauge gauge--low"><span style={{ width: '8%' }} /></span><em>May run out this week</em></li>
            <li><span>🫘 Beans · Paint bucket</span><span className="gauge"><span style={{ width: '64%' }} /></span><em>About 3 weeks left</em></li>
          </ul>
        </div>
      </section>

      {/* BUDGET EXPLAINER */}
      <section className="section k-home">
        <div className="container k-home__grid">
          <div className="k-home__art" aria-hidden="true">
            <DishArt dish="egusi" className="k-home__a" />
            <DishArt dish="jollof" steam className="k-home__b" />
            <DishArt dish="dodo" className="k-home__c" />
          </div>
          <div>
            <p className="k-eyebrow">New · Jojo’s Kitchen</p>
            <h2 className="section__title" style={{ color: '#fff' }}>Rather have it cooked?</h2>
            <p className="k-home__lead">Jojo also cooks on demand — smoky jollof, egusi, efo riro, ofada, pepper soup, small chops and party trays.
              Made fresh in a clean, private kitchen, exactly your way: no garlic, no ginger, less oil, mild pepper. Delivered across Lagos.</p>
            <div className="hero__ctas">
              <Link to="/kitchen" className="btn btn--accent btn--lg">See the menu</Link>
              <Link to="/kitchen#menu" className="btn btn--lg k-btn-light">Party orders</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--green">
        <div className="container budget">
          <div>
            <p className="eyebrow eyebrow--gold">Honest pricing</p>
            <h2 className="section__title">Market prices aren’t fixed. Your limit is.</h2>
            <p>
              Some things have a known price for the usual unit — a basket of tomatoes, a bag of onions. Some vary by type, like
              Basmati versus local rice. Many, like ugwu or crayfish, you simply buy by how much you want to spend. You tell us
              what you <em>hope</em> to spend, and separately the most Jojo may spend without checking with you.
            </p>
          </div>
          <div className="budget__meter" aria-hidden="true">
            <div className="meter">
              <div className="meter__fill" style={{ width: '72%' }} />
              <div className="meter__mark meter__mark--budget" style={{ left: '84%' }}><span>Budget ₦118.5k</span></div>
              <div className="meter__mark meter__mark--limit" style={{ left: '94%' }}><span>Limit ₦125k</span></div>
            </div>
            <p className="meter__caption">Actual spend ₦104,200 · ₦14,300 back to you as a refund or credit</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="section">
        <div className="container faq">
          <header className="section__head section__head--left">
            <p className="eyebrow">Questions</p>
            <h2 className="section__title">Good to know</h2>
            <p className="section__lead">Still unsure? Email <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>.</p>
          </header>
          <div className="faq__list">
            {FAQS.map((f) => (
              <details key={f.q} className="faq__item">
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-band">
        <div className="container cta-band__inner">
          <div>
            <h2>Ready for a stress-free market day?</h2>
            <p>Create a free account in a minute. You only pay once you accept a quote.</p>
          </div>
          <Link to={ctaTo} className="btn btn--gold btn--lg">{user ? 'Open my dashboard' : 'Create my account'}</Link>
        </div>
      </section>
    </>
  );
}
