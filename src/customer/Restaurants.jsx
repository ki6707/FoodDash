import { useDeferredValue, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { categories } from '../data/mock';
import { Empty } from '../components/shared';
import { RestaurantCard } from './Home';

export default function Restaurants() {
  const { restaurants, foods } = useApp();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [category, setCategory] = useState(params.get('category') ?? 'all');
  const [vegOnly, setVegOnly] = useState(false);
  const [openOnly, setOpenOnly] = useState(false);
  const [sort, setSort] = useState('rating');
  const deferred = useDeferredValue(q);

  const results = useMemo(() => {
    const term = deferred.trim().toLowerCase();
    return restaurants
      .filter((r) => r.approval === 'approved')
      .filter((r) => category === 'all' || r.category === category)
      .filter((r) => !vegOnly || r.veg)
      .filter((r) => !openOnly || r.open)
      .filter((r) => {
        if (!term) return true;
        const dishMatch = foods.some((f) => f.restaurantId === r.id && f.name.toLowerCase().includes(term));
        return r.name.toLowerCase().includes(term) || r.cuisine.join(' ').toLowerCase().includes(term) || dishMatch;
      })
      .sort((a, b) => (sort === 'rating' ? b.rating - a.rating : sort === 'eta' ? (a.eta || 999) - (b.eta || 999) : a.priceFor2 - b.priceFor2));
  }, [restaurants, foods, deferred, category, vegOnly, openOnly, sort]);

  const pick = (id) => {
    setCategory(id);
    const next = new URLSearchParams(params);
    if (id === 'all') next.delete('category'); else next.set('category', id);
    setParams(next, { replace: true });
  };

  return (
    <div className="stack">
      <h1>Restaurants</h1>
      <div className="card stack">
        <div className="search-row" role="search">
          <label className="sr-only" htmlFor="rs">Search restaurants or dishes</label>
          <input id="rs" className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search restaurants, cuisines or dishes" />
          <label className="sr-only" htmlFor="sort">Sort by</label>
          <select id="sort" className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="rating">Top rated</option>
            <option value="eta">Fastest delivery</option>
            <option value="price">Lowest price</option>
          </select>
        </div>
        <div className="chips" role="group" aria-label="Filters">
          <button className="chip" aria-pressed={category === 'all'} onClick={() => pick('all')}>All</button>
          {categories.map((c) => (
            <button key={c.id} className="chip" aria-pressed={category === c.id} onClick={() => pick(c.id)}>{c.name}</button>
          ))}
          <button className="chip" aria-pressed={vegOnly} onClick={() => setVegOnly((v) => !v)}>Pure veg</button>
          <button className="chip" aria-pressed={openOnly} onClick={() => setOpenOnly((v) => !v)}>Open now</button>
        </div>
      </div>
      <p className="muted" aria-live="polite">{results.length} restaurant{results.length === 1 ? '' : 's'} found</p>
      {results.length ? (
        <div className="grid cols-3">{results.map((r) => <RestaurantCard key={r.id} r={r} />)}</div>
      ) : (
        <Empty icon={SearchX} title="Nothing matches yet">
          <p>Try a different dish or clear a filter.</p>
          <button className="btn" onClick={() => { setQ(''); pick('all'); setVegOnly(false); setOpenOnly(false); }}>Clear filters</button>
        </Empty>
      )}
    </div>
  );
}
