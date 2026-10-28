import React from 'react';
import './App.css';
import { useCallback, useEffect, useState } from 'react';
import { Clapperboard, Plus, Search, SlidersHorizontal, ChevronLeft, ChevronRight, Sparkles, Film, Clock3, Star, TrendingUp, RefreshCw, Popcorn, X, LoaderCircle } from 'lucide-react';
import api, { getErrorMessage } from './api';
import MovieForm from './components/MovieForm';
import MovieCard from './components/MovieCard';
import StatsDashboard from './components/StatsDashboard.jsx';
const genres = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Thriller'];
const statuses = ['To Watch', 'Watching', 'Watched'];
const emptyStats = { statusCounts: { 'To Watch': 0, 'Watching': 0, 'Watched': 0 }, totalMovies: 0, totalHoursWatched: 0, averageRating: null, mostWatchedGenre: null };

export default function App() {
  const [movies, setMovies] = useState([]);
  const [stats, setStats] = useState(emptyStats);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalMovies, setTotalMovies] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState(null);
  const [watchNext, setWatchNext] = useState(null);
  const [watchNextError, setWatchNextError] = useState('');

  const refreshStats = useCallback(async () => {
    try { const response = await api.get('/movies/stats'); setStats(response.data.data); }
    catch (error) { console.error('Could not load statistics:', getErrorMessage(error)); }
  }, []);

  const loadMovies = useCallback(async (opts = {}) => {
    setLoading(true);
    try {
      const response = await api.get('/movies', { params: { page: opts.page ?? page, limit: 6, status: statusFilter || undefined, genre: genreFilter || undefined, search: search || undefined } });
      const data = response.data.data;
      setMovies(data.movies); setTotalPages(data.totalPages); setTotalMovies(data.totalMovies); setPage(data.currentPage);
    } catch (error) { setNotice({ type: 'error', text: getErrorMessage(error) }); }
    finally { setLoading(false); }
  }, [page, statusFilter, genreFilter, search]);

  useEffect(() => { loadMovies(); }, [loadMovies]);
  useEffect(() => { refreshStats(); }, [refreshStats]);
  const refreshAll = async () => { await Promise.all([loadMovies(), refreshStats()]); };
  const showNotice = (type, text) => { setNotice({ type, text }); window.setTimeout(() => setNotice(null), 4500); };

  const openAdd = () => { setEditingMovie(null); setFormError(''); setFormOpen(true); };
  const openEdit = movie => { setEditingMovie(movie); setFormError(''); setFormOpen(true); };
  const submitMovie = async form => {
    setBusy(true); setFormError('');
    try {
      if (editingMovie) await api.put(`/movies/${editingMovie._id}`, { title: form.title, genre: form.genre, runtime: form.runtime, platform: form.platform, priority: form.priority });
      else await api.post('/movies', form);
      setFormOpen(false); setEditingMovie(null); setPage(1);
      // Fetch using page 1 explicitly because React state updates are asynchronous.
      const response = await api.get('/movies', { params: { page: 1, limit: 6, status: statusFilter || undefined, genre: genreFilter || undefined, search: search || undefined } });
      setMovies(response.data.data.movies); setTotalPages(response.data.data.totalPages); setTotalMovies(response.data.data.totalMovies); setPage(1);
      await refreshStats(); showNotice('success', editingMovie ? 'Movie details updated.' : 'Movie added to your watchlist.');
    } catch (error) { setFormError(getErrorMessage(error)); }
    finally { setBusy(false); }
  };
  const changeStatus = async (movie, status, rating) => {
    setBusy(true);
    try {
      await api.patch(`/movies/${movie._id}/status`, { status, ...(rating !== null ? { rating } : {}) });
      await refreshAll(); showNotice('success', `${movie.title} moved to ${status}.`);
    } catch (error) { showNotice('error', getErrorMessage(error)); }
    finally { setBusy(false); }
  };
  const changeRating = async (movie, rating) => {
    setBusy(true);
    try { await api.patch(`/movies/${movie._id}/rating`, { rating }); await refreshAll(); showNotice('success', 'Rating updated.'); }
    catch (error) { showNotice('error', getErrorMessage(error)); }
    finally { setBusy(false); }
  };
  const deleteMovie = async movie => {
    if (movie.status === 'Watching') return;
    if (!window.confirm(`Delete “${movie.title}” (${movie.releaseYear})? This cannot be undone.`)) return;
    setBusy(true);
    try { await api.delete(`/movies/${movie._id}`); await refreshAll(); showNotice('success', 'Movie deleted.'); }
    catch (error) { showNotice('error', getErrorMessage(error)); }
    finally { setBusy(false); }
  };
  const findWatchNext = async () => {
    setWatchNext(null); setWatchNextError('');
    try { const response = await api.get('/movies/watch-next'); setWatchNext(response.data.data); }
    catch (error) { setWatchNextError(getErrorMessage(error)); }
  };
  const applySearch = e => { e.preventDefault(); setPage(1); setSearch(searchInput.trim()); };
  const clearFilters = () => { setStatusFilter(''); setGenreFilter(''); setSearch(''); setSearchInput(''); setPage(1); };
  const anyFilters = Boolean(statusFilter || genreFilter || search);

  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#top"><span className="brand-mark"><Clapperboard size={22}/></span><span>movie<span className="brand-light">shelf</span><small>YOUR PERSONAL CINEMA</small></span></a><div className="topbar-right"><span className="collection-count"><Film size={15}/> {stats.totalMovies} in collection</span><button className="button button-primary top-add" onClick={openAdd}><Plus size={17}/> Add movie</button></div></header>
    <main id="top" className="page-container">
      <section className="hero"><div className="hero-copy"><span className="eyebrow hero-eyebrow"><Sparkles size={13}/> YOUR NEXT GREAT WATCH</span><h1>Every movie night<br/>starts <em>somewhere.</em></h1><p>Your personal corner of cinema. Keep track of what you love, what’s next, and every story in between.</p><div className="hero-actions"><button className="button button-primary hero-button" onClick={openAdd}><Plus size={17}/> Add to watchlist</button><button className="button button-outline hero-button" onClick={findWatchNext}><Sparkles size={16}/> What should I watch next?</button></div></div><div className="hero-art" aria-hidden="true"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="hero-disc"><Popcorn size={56} strokeWidth={1.1}/></div><span className="floating-star star-a">✦</span><span className="floating-star star-b">✧</span><span className="floating-dot dot-a"/><span className="floating-dot dot-b"/><div className="art-caption">LIGHTS DOWN.<br/><span>STORY ON.</span></div></div></section>

      {watchNext && <section className="watch-next-panel"><div className="watch-next-icon"><Sparkles size={22}/></div><div className="watch-next-copy"><span className="eyebrow">YOUR NEXT PICK</span><h2>{watchNext.title}</h2><p>{watchNext.releaseYear} · {watchNext.genre} · {watchNext.runtime} min · Priority {watchNext.priority}/5</p><span className="watch-next-code">{watchNext.movieCode}</span></div><button className="icon-button" onClick={() => setWatchNext(null)} aria-label="Dismiss recommendation"><X size={18}/></button></section>}
      {watchNextError && <div className="inline-message error-message"><span>{watchNextError}</span><button className="icon-button small" onClick={() => setWatchNextError('')} aria-label="Dismiss"><X size={16}/></button></div>}
      {notice && <div className={`toast toast-${notice.type}`} role="status"><span>{notice.text}</span><button className="toast-close" onClick={() => setNotice(null)} aria-label="Dismiss notification"><X size={15}/></button></div>}

      <section className="stats-section"><div className="section-heading"><div><span className="eyebrow">AT A GLANCE</span><h2>Your movie universe</h2></div><button className="refresh-button" onClick={refreshAll} title="Refresh data"><RefreshCw size={14}/> Refresh</button></div><div className="stats-grid">
        <div className="stat-card stat-total"><div className="stat-icon"><Film size={19}/></div><span className="stat-label">Total movies</span><strong>{stats.totalMovies}</strong><span className="stat-foot">in your collection</span></div>
        <div className="stat-card stat-towatch"><div className="stat-icon"><Clock3 size={19}/></div><span className="stat-label">To watch</span><strong>{stats.statusCounts['To Watch']}</strong><span className="stat-foot">stories waiting for you</span></div>
        <div className="stat-card stat-watching"><div className="stat-icon"><TrendingUp size={19}/></div><span className="stat-label">Watching</span><strong>{stats.statusCounts.Watching}</strong><span className="stat-foot">currently in progress</span></div>
        <div className="stat-card stat-watched"><div className="stat-icon"><Star size={19}/></div><span className="stat-label">Hours watched</span><strong>{stats.totalHoursWatched}<small>h</small></strong><span className="stat-foot">{stats.statusCounts.Watched} movies completed</span></div>
        <div className="stat-card stat-rating"><div className="stat-icon"><Star size={19}/></div><span className="stat-label">Average rating</span><strong>{stats.averageRating ?? '—'}<small>{stats.averageRating !== null ? '/10' : ''}</small></strong><span className="stat-foot">your watched movies</span></div>
        <div className="stat-card stat-genre"><div className="stat-icon"><Clapperboard size={19}/></div><span className="stat-label">Top genre watched</span><strong className="genre-stat">{stats.mostWatchedGenre?.genre || '—'}</strong><span className="stat-foot">{stats.mostWatchedGenre ? `${stats.mostWatchedGenre.count} watched movie${stats.mostWatchedGenre.count === 1 ? '' : 's'}` : 'no watched movies yet'}</span></div>
      </div></section>

      <section className="collection-section"><div className="section-heading collection-heading"><div><span className="eyebrow">THE COLLECTION</span><h2>Find your next favourite</h2><p className="section-subtitle">Every story worth keeping, all in one place.</p></div><button className="button button-primary desktop-add" onClick={openAdd}><Plus size={17}/> Add movie</button></div>
        <div className="toolbar"><form className="search-box" onSubmit={applySearch}><Search size={17}/><input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search movies by title…" aria-label="Search movies by title"/><button type="submit">Search</button></form><div className="filters"><span className="filter-label"><SlidersHorizontal size={14}/> Filter</span><select aria-label="Filter by status" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}><option value="">All statuses</option>{statuses.map(s => <option key={s}>{s}</option>)}</select><select aria-label="Filter by genre" value={genreFilter} onChange={e => { setGenreFilter(e.target.value); setPage(1); }}><option value="">All genres</option>{genres.map(g => <option key={g}>{g}</option>)}</select>{anyFilters && <button className="clear-filters" onClick={clearFilters}>Clear</button>}</div></div>
        <div className="results-line"><span>{loading ? 'Loading your collection…' : <><strong>{totalMovies}</strong> {totalMovies === 1 ? 'movie' : 'movies'} {anyFilters ? 'found' : 'in your watchlist'}</>}</span>{anyFilters && <span className="filtered-label">Filtered results</span>}</div>
        {loading ? <div className="loading-state"><LoaderCircle className="spin" size={28}/><p>Gathering your movies…</p></div> : movies.length ? <div className="movie-grid">{movies.map(movie => <MovieCard key={movie._id} movie={movie} onEdit={openEdit} onDelete={deleteMovie} onStatusChange={changeStatus} onRatingChange={changeRating} busy={busy}/>)}</div> : <div className="empty-state"><div className="empty-icon"><Film size={28}/></div><h3>{anyFilters ? 'No movies match those filters' : 'Your watchlist is a blank screen'}</h3><p>{anyFilters ? 'Try changing your search or clearing the filters.' : 'Every great movie night begins with a first pick. Add a movie to get started.'}</p>{anyFilters ? <button className="button button-outline" onClick={clearFilters}>Clear filters</button> : <button className="button button-primary" onClick={openAdd}><Plus size={16}/> Add your first movie</button>}</div>}
        {!loading && totalPages > 1 && <div className="pagination"><span>Page <strong>{page}</strong> of {totalPages}</span><div className="pagination-actions"><button className="page-button" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}><ChevronLeft size={17}/> Previous</button><span className="page-number">{page}</span><button className="page-button" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next <ChevronRight size={17}/></button></div></div>}
      </section>
      <footer className="footer"><a className="footer-brand" href="#top"><Clapperboard size={17}/> MovieShelf</a><span>Made for the love of stories.</span><span>YOUR COLLECTION · YOUR CINEMA</span></footer>
    </main>
    {formOpen && <MovieForm initialMovie={editingMovie} onClose={() => { setFormOpen(false); setFormError(''); }} onSubmit={submitMovie} busy={busy} error={formError}/>}
  </div>;
}