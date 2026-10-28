import React from 'react';
import { useEffect, useState } from 'react';
import { X, Film, Save } from 'lucide-react';

const genres = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Thriller'];
const platforms = ['Netflix', 'Prime Video', 'Hotstar', 'Theatre', 'Other'];
const currentYear = new Date().getFullYear();
const blank = { title: '', genre: 'Action', releaseYear: currentYear, runtime: 120, platform: 'Netflix', priority: 3 };

export default function MovieForm({ initialMovie, onClose, onSubmit, busy, error }) {
  const [form, setForm] = useState(blank);
  const [localError, setLocalError] = useState('');
  useEffect(() => {
    setForm(initialMovie ? {
      title: initialMovie.title, genre: initialMovie.genre, releaseYear: initialMovie.releaseYear,
      runtime: initialMovie.runtime, platform: initialMovie.platform, priority: initialMovie.priority
    } : blank);
    setLocalError('');
  }, [initialMovie]);
  const update = (key, value) => setForm(previous => ({ ...previous, [key]: value }));
  const handleSubmit = async (event) => {
    event.preventDefault(); setLocalError('');
    const year = Number(form.releaseYear), runtime = Number(form.runtime), priority = Number(form.priority);
    if (!form.title.trim()) return setLocalError('Please enter a movie title.');
    if (!Number.isInteger(year) || year < 1950 || year > currentYear) return setLocalError(`Release year must be between 1950 and ${currentYear}.`);
    if (!Number.isInteger(runtime) || runtime < 30 || runtime > 300) return setLocalError('Runtime must be between 30 and 300 minutes.');
    if (!Number.isInteger(priority) || priority < 1 || priority > 5) return setLocalError('Priority must be from 1 to 5.');
    await onSubmit({ ...form, title: form.title.trim(), releaseYear: year, runtime, priority });
  };
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="movie-form-title">
      <div className="modal-heading"><div><span className="eyebrow">YOUR COLLECTION</span><h2 id="movie-form-title">{initialMovie ? 'Edit movie' : 'Add a movie'}</h2><p>{initialMovie ? 'Update your movie details.' : 'Save something great for movie night.'}</p></div><button className="icon-button" onClick={onClose} aria-label="Close form"><X size={20}/></button></div>
      <form onSubmit={handleSubmit} className="movie-form">
        <label className="field full">Movie title<input autoFocus maxLength="120" value={form.title} onChange={e => update('title', e.target.value)} placeholder="e.g. Interstellar" required /></label>
        <label className="field">Genre<select value={form.genre} onChange={e => update('genre', e.target.value)}>{genres.map(v => <option key={v}>{v}</option>)}</select></label>
        <label className="field">Release year<input type="number" min="1950" max={currentYear} value={form.releaseYear} disabled={!!initialMovie} onChange={e => update('releaseYear', e.target.value)} required />{initialMovie && <small>Release year cannot be changed.</small>}</label>
        <label className="field">Runtime (minutes)<input type="number" min="30" max="300" value={form.runtime} onChange={e => update('runtime', e.target.value)} required /></label>
        <label className="field">Streaming platform<select value={form.platform} onChange={e => update('platform', e.target.value)}>{platforms.map(v => <option key={v}>{v}</option>)}</select></label>
        <label className="field full">Priority <span className="field-note">5 is highest</span><div className="priority-picker">{[1,2,3,4,5].map(n => <button type="button" key={n} className={Number(form.priority) === n ? 'priority-choice active' : 'priority-choice'} onClick={() => update('priority', n)}>{n}<span>★</span></button>)}</div></label>
        {(localError || error) && <div className="form-error full" role="alert">{localError || error}</div>}
        <div className="modal-actions full"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button className="button button-primary" type="submit" disabled={busy}><Save size={16}/>{busy ? 'Saving…' : initialMovie ? 'Save changes' : 'Add movie'}</button></div>
      </form>
    </section>
  </div>;
}
