import React from 'react';
import { useState } from 'react';
import { Clock3, Pencil, Trash2, Star, Film, Check, ChevronDown, CalendarDays } from 'lucide-react';

const validNext = { 'To Watch': ['Watching', 'Watched'], 'Watching': ['To Watch', 'Watched'], 'Watched': [] };
export default function MovieCard({ movie, onEdit, onDelete, onStatusChange, onRatingChange, busy }) {
  const [nextStatus, setNextStatus] = useState('');
  const [rating, setRating] = useState('');
  const [showRating, setShowRating] = useState(false);
  const [newRating, setNewRating] = useState(movie.rating || 8);
  const options = validNext[movie.status] || [];
  const chooseStatus = (value) => {
    setNextStatus(value);
    if (value === 'Watched') setShowRating(true);
    else if (value) onStatusChange(movie, value, null).finally(() => setNextStatus(''));
  };
  const confirmWatched = async () => {
    if (!rating || Number(rating) < 1 || Number(rating) > 10) return;
    await onStatusChange(movie, 'Watched', Number(rating)); setShowRating(false); setNextStatus(''); setRating('');
  };
  const saveRating = async () => { await onRatingChange(movie, Number(newRating)); };
  return <article className="movie-card">
    <div className={`movie-poster poster-${movie.genre.toLowerCase().replace(/[^a-z]/g, '')}`}><div className="poster-grain"/><span className="poster-icon"><Film size={30}/></span><span className="poster-genre">{movie.genre}</span><span className="poster-code">{movie.movieCode}</span><span className="priority-pill">★ {movie.priority}</span></div>
    <div className="movie-content">
      <div className="movie-title-row"><div><h3>{movie.title}</h3><p className="movie-meta">{movie.releaseYear} <span>•</span> <Clock3 size={13}/> {movie.runtime} min</p></div><button className="icon-button small" onClick={() => onEdit(movie)} title="Edit movie" aria-label={`Edit ${movie.title}`}><Pencil size={15}/></button></div>
      <div className="movie-details"><span className={`status-badge status-${movie.status.toLowerCase().replace(' ', '-')}`}>{movie.status}</span><span className="platform-label">{movie.platform}</span></div>
      {movie.status === 'Watched' ? <div className="rating-row"><span className="rating-value"><Star size={15} fill="currentColor"/> {movie.rating ?? '—'}<small>/10</small></span><button className="text-button" onClick={() => { setNewRating(movie.rating || 8); document.getElementById(`rating-${movie._id}`)?.showModal?.(); }}>Edit rating</button><dialog id={`rating-${movie._id}`} className="rating-dialog"><form method="dialog" onSubmit={e => { e.preventDefault(); saveRating().then(() => e.currentTarget.closest('dialog')?.close()); }}><h3>Update rating</h3><p>{movie.title}</p><label className="field">Rating (1–10)<input type="number" min="1" max="10" value={newRating} onChange={e => setNewRating(e.target.value)} required /></label><div className="modal-actions"><button className="button button-quiet" value="cancel">Cancel</button><button className="button button-primary" type="submit" disabled={busy}>Save rating</button></div></form></dialog></div> : <div className="status-control"><label htmlFor={`status-${movie._id}`}>Move to</label><div className="select-wrap"><select id={`status-${movie._id}`} value={nextStatus} onChange={e => chooseStatus(e.target.value)} disabled={busy || options.length === 0}><option value="">Change status…</option>{options.map(s => <option key={s} value={s}>{s}</option>)}</select><ChevronDown size={14}/></div></div>}
      {showRating && <div className="inline-rating"><label htmlFor={`rating-input-${movie._id}`}>Your rating (required)</label><div className="inline-rating-row"><input id={`rating-input-${movie._id}`} type="number" min="1" max="10" value={rating} onChange={e => setRating(e.target.value)} placeholder="1–10"/><button className="button button-primary compact" onClick={confirmWatched} disabled={busy || !rating || Number(rating) < 1 || Number(rating) > 10}><Check size={14}/>Mark watched</button><button className="icon-button small" onClick={() => { setShowRating(false); setNextStatus(''); }} aria-label="Cancel">×</button></div></div>}
      {movie.watchedDate && <p className="watched-date"><CalendarDays size={13}/> Watched {new Date(movie.watchedDate).toLocaleDateString()}</p>}
      <div className="movie-footer"><span className="movie-code-small">{movie.movieCode}</span><button className="delete-button" disabled={movie.status === 'Watching' || busy} onClick={() => onDelete(movie)} title={movie.status === 'Watching' ? 'Watching movies cannot be deleted' : 'Delete movie'}><Trash2 size={14}/> Delete</button></div>
    </div>
  </article>;
}
