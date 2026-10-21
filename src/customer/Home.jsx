import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, Cake, Clock, Leaf, MapPin, Pizza, Salad, Sandwich, Search,
  Soup, Tag, UtensilsCrossed,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { categories } from '../data/mock';
import { FOOD_IMAGES, getRestaurantImage } from '../data/foodImages';
import { Cover, Rating } from '../components/shared';
import { money } from '../utils/orderStatus';

const CATEGORY_ICON = {
  pizza: Pizza,
  biryani: UtensilsCrossed,
  burger: Sandwich,
  south: Salad,
  chinese: Soup,
  dessert: Cake,
};

export function RestaurantCard({ r }) {
  return (
    <Link
      to={`/restaurants/${r.id}`}
      className="card block flush restaurant-card"
      aria-label={`${r.name}${r.open ? '' : ', currently closed'}`}
    >
      <Cover color={r.color} category={r.category} imageUrl={getRestaurantImage(r).src} size={52} label={getRestaurantImage(r).alt} className="restaurant-card-cover" />
      <div className="body">
        <div className="restaurant-card-heading">
          <h3>{r.name}</h3>
          <Rating value={r.rating} />
        </div>
        <div className="muted restaurant-cuisine">{r.cuisine.join(' · ')}</div>
        <div className="meta">
          <span><Clock size={13} aria-hidden="true" /> {r.eta ? `${r.eta} min` : '—'}</span>
          <span>{money(r.priceFor2)} for two</span>
          {!r.open && <span className="badge neutral">Closed</span>}
          {r.veg && <span className="badge success"><Leaf size={12} aria-hidden="true" /> Pure veg</span>}
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const { restaurants, coupons } = useApp();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const approved = restaurants.filter((r) => r.approval === 'approved');
  const openRestaurants = approved.filter((r) => r.open);
  const featured = [...openRestaurants].sort((a, b) => b.rating - a.rating).slice(0, 6);
  const vegFeatured = openRestaurants.filter((r) => r.veg).slice(0, 3);
  const activeCoupons = coupons.filter((coupon) => coupon.active && coupon.validUntil >= new Date().toISOString().slice(0, 10));
  const heroRestaurant = openRestaurants.find((r) => r.category === 'south') ?? openRestaurants[0];

  return (
    <div className="home-page">
      <section className="home-hero" aria-labelledby="hero-title">
        <div className="home-hero-main">
          <p className="home-kicker"><MapPin size={15} aria-hidden="true" /> Serving Tiruchirappalli</p>
          <h1 id="hero-title">Good food is closer than you think.</h1>
          <p className="home-lead">Find a local favorite, choose what you love, and follow your order all the way home.</p>
          <form
            className="home-search"
            role="search"
            onSubmit={(e) => { e.preventDefault(); nav(`/restaurants?q=${encodeURIComponent(q)}`); }}
          >
            <label className="sr-only" htmlFor="home-search">Search restaurants or dishes</label>
            <input
              id="home-search"
              className="input home-search-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Try biryani, dosa, or pizza"
            />
            <button className="btn primary" type="submit">
              <Search size={17} aria-hidden="true" /> Search
            </button>
          </form>
        </div>
        <aside className="home-hero-aside" aria-label="Featured neighborhood restaurant">
          {heroRestaurant && (
            <figure className="home-featured-food">
              <img src={getRestaurantImage(heroRestaurant).src} alt={getRestaurantImage(heroRestaurant).alt} fetchPriority="high" />
              <figcaption>
                <span>Neighborhood favorite</span>
                <strong>{heroRestaurant.name}</strong>
                <span>{heroRestaurant.cuisine.join(' · ')} · {heroRestaurant.eta} min</span>
              </figcaption>
            </figure>
          )}
          <Link to="/restaurants" className="home-aside-link">Explore {openRestaurants.length} open kitchens <ArrowRight size={16} aria-hidden="true" /></Link>
        </aside>
      </section>

      <section className="home-section" aria-labelledby="cat-title">
        <div className="section-header">
          <div>
            <p className="eyebrow">Start with a craving</p>
            <h2 id="cat-title">Browse by cuisine</h2>
          </div>
          <Link to="/restaurants" className="text-link">
            All restaurants <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
        <div className="category-grid">
          {categories.map((category) => {
            const Icon = CATEGORY_ICON[category.id] ?? UtensilsCrossed;
            return (
            <Link
              key={category.id}
              to={`/restaurants?category=${category.id}`}
              className="category-tile"
              style={{ '--category-color': category.color }}
            >
              <span className="category-icon"><Icon size={21} strokeWidth={1.7} aria-hidden="true" /></span>
              <span>{category.name}</span>
              <ArrowRight className="category-arrow" size={15} aria-hidden="true" />
            </Link>
            );
          })}
        </div>
      </section>

      {activeCoupons.length > 0 && (
        <section className="home-section" aria-labelledby="promo-title">
          <div className="section-header">
            <div>
              <p className="eyebrow">A little extra</p>
              <h2 id="promo-title">Offers on your next order</h2>
            </div>
            <Tag size={20} aria-hidden="true" />
          </div>
          <div className="offer-grid">
            {activeCoupons.map((coupon) => (
              <article key={coupon.id} className="offer-tile">
                <span className="offer-icon"><Tag size={17} aria-hidden="true" /></span>
                <div>
                  <strong>{coupon.type === 'percent' ? `${coupon.value}% off` : `${money(coupon.value)} off`}</strong>
                  <p>{coupon.type === 'percent' ? `Up to ${money(coupon.max)}` : `On orders over ${money(coupon.minOrder)}`}</p>
                </div>
                <span className="promo-code">{coupon.code}</span>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="home-section" aria-labelledby="top-title">
        <div className="section-header">
          <div>
            <p className="eyebrow">Picked by local diners</p>
            <h2 id="top-title">Popular near you</h2>
          </div>
          <Link to="/restaurants" className="text-link">See all <ArrowRight size={15} aria-hidden="true" /></Link>
        </div>
        <div className="grid cols-3">
          {featured.map((r) => <RestaurantCard key={r.id} r={r} />)}
        </div>
      </section>

      {vegFeatured.length > 0 && (
        <section className="home-section" aria-labelledby="veg-title">
          <div className="section-header">
            <div>
              <p className="eyebrow"><Leaf size={13} aria-hidden="true" /> Vegetarian kitchens</p>
              <h2 id="veg-title">Fresh, meat-free favorites</h2>
            </div>
            <Link to="/restaurants?category=south" className="text-link">Explore <ArrowRight size={15} aria-hidden="true" /></Link>
          </div>
          <div className="grid cols-3">
            {vegFeatured.map((r) => <RestaurantCard key={r.id} r={r} />)}
          </div>
        </section>
      )}

    </div>
  );
}
