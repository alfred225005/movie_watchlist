const Movie = require('../models/Movie');
const Counter = require('../models/Counter');

const genres = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Thriller'];
const platforms = ['Netflix', 'Prime Video', 'Hotstar', 'Theatre', 'Other'];
const statuses = ['To Watch', 'Watching', 'Watched'];
const currentYear = () => new Date().getFullYear();
const send = (res, status, success, message, data = null) => res.status(status).json({ success, message, data });
const validRating = value => Number.isInteger(value) && value >= 1 && value <= 10;

async function nextMovieCode(year) {
  // Atomic increment prevents two simultaneous requests from receiving the same sequence.
  const counter = await Counter.findByIdAndUpdate(
    String(year), { $inc: { sequence: 1 } }, { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return `MV-${year}-${String(counter.sequence).padStart(3, '0')}`;
}

exports.createMovie = async (req, res, next) => {
  try {
    const { title, genre, releaseYear, runtime, platform, priority } = req.body;
    if (typeof title !== 'string' || !title.trim()) return send(res, 400, false, 'Title is required.');
    const year = Number(releaseYear), minutes = Number(runtime), rank = Number(priority);
    if (!Number.isInteger(year) || year < 1950 || year > currentYear()) return send(res, 400, false, `Release year must be between 1950 and ${currentYear()}.`);
    if (!Number.isInteger(minutes) || minutes < 30 || minutes > 300) return send(res, 400, false, 'Runtime must be between 30 and 300 minutes.');
    if (!genres.includes(genre)) return send(res, 400, false, 'Please choose a valid genre.');
    if (!platforms.includes(platform)) return send(res, 400, false, 'Please choose a valid platform.');
    if (!Number.isInteger(rank) || rank < 1 || rank > 5) return send(res, 400, false, 'Priority must be between 1 and 5.');

    const cleanTitle = title.trim();
    const titleNormalized = cleanTitle.toLocaleLowerCase('en');
    const duplicate = await Movie.findOne({ titleNormalized, releaseYear: year });
    if (duplicate) return send(res, 409, false, 'A movie with this title and release year already exists.');
    const movieCode = await nextMovieCode(year);
    const movie = await Movie.create({ movieCode, title: cleanTitle, titleNormalized, genre, releaseYear: year, runtime: minutes, platform, priority: rank, status: 'To Watch', rating: null, watchedDate: null });
    return send(res, 201, true, 'Movie added successfully.', movie);
  } catch (error) {
    if (error.code === 11000) return send(res, 409, false, 'A movie with this title and release year already exists.');
    next(error);
  }
};

exports.getMovies = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = 6;
    const filter = {};
    if (req.query.status) {
      if (!statuses.includes(req.query.status)) return send(res, 400, false, 'Invalid status filter.');
      filter.status = req.query.status;
    }
    if (req.query.genre) {
      if (!genres.includes(req.query.genre)) return send(res, 400, false, 'Invalid genre filter.');
      filter.genre = req.query.genre;
    }
    if (req.query.search && String(req.query.search).trim()) {
      const escaped = String(req.query.search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.title = { $regex: escaped, $options: 'i' };
    }
    const totalMovies = await Movie.countDocuments(filter);
    const totalPages = Math.ceil(totalMovies / limit);
    // Sort in MongoDB before skip/limit, so priority order is correct across pages.
    const movies = await Movie.aggregate([
      { $match: filter },
      { $addFields: { statusOrder: { $switch: { branches: [
        { case: { $eq: ['$status', 'To Watch'] }, then: 0 },
        { case: { $eq: ['$status', 'Watching'] }, then: 1 },
        { case: { $eq: ['$status', 'Watched'] }, then: 2 }
      ], default: 3 } } } },
      { $sort: { statusOrder: 1, priority: -1, runtime: 1, createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      { $project: { statusOrder: 0 } }
    ]);
    return send(res, 200, true, 'Movies fetched successfully.', { movies, currentPage: page, totalPages, totalMovies, limit });
  } catch (error) { next(error); }
};

exports.getMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return send(res, 404, false, 'Movie not found.');
    return send(res, 200, true, 'Movie fetched successfully.', movie);
  } catch (error) { next(error); }
};

exports.updateMovie = async (req, res, next) => {
  try {
    const allowed = ['title', 'genre', 'runtime', 'platform', 'priority'];
    const keys = Object.keys(req.body);
    if (keys.some(key => !allowed.includes(key))) return send(res, 400, false, 'Only title, genre, runtime, platform and priority can be edited. Movie code and release year cannot be changed.');
    const movie = await Movie.findById(req.params.id);
    if (!movie) return send(res, 404, false, 'Movie not found.');
    if (req.body.title !== undefined) {
      if (typeof req.body.title !== 'string' || !req.body.title.trim()) return send(res, 400, false, 'Title is required.');
      const title = req.body.title.trim();
      const normalized = title.toLocaleLowerCase('en');
      const duplicate = await Movie.findOne({ _id: { $ne: movie._id }, titleNormalized: normalized, releaseYear: movie.releaseYear });
      if (duplicate) return send(res, 409, false, 'A movie with this title and release year already exists.');
      movie.title = title; movie.titleNormalized = normalized;
    }
    if (req.body.genre !== undefined) { if (!genres.includes(req.body.genre)) return send(res, 400, false, 'Please choose a valid genre.'); movie.genre = req.body.genre; }
    if (req.body.runtime !== undefined) { const v = Number(req.body.runtime); if (!Number.isInteger(v) || v < 30 || v > 300) return send(res, 400, false, 'Runtime must be between 30 and 300 minutes.'); movie.runtime = v; }
    if (req.body.platform !== undefined) { if (!platforms.includes(req.body.platform)) return send(res, 400, false, 'Please choose a valid platform.'); movie.platform = req.body.platform; }
    if (req.body.priority !== undefined) { const v = Number(req.body.priority); if (!Number.isInteger(v) || v < 1 || v > 5) return send(res, 400, false, 'Priority must be between 1 and 5.'); movie.priority = v; }
    await movie.save();
    return send(res, 200, true, 'Movie updated successfully.', movie);
  } catch (error) { if (error.code === 11000) return send(res, 409, false, 'A movie with this title and release year already exists.'); next(error); }
};

exports.changeStatus = async (req, res, next) => {
  try {
    const { status, rating } = req.body;
    if (!statuses.includes(status)) return send(res, 400, false, 'Please choose a valid status.');
    const movie = await Movie.findById(req.params.id);
    if (!movie) return send(res, 404, false, 'Movie not found.');
    if (movie.status === 'Watched') return send(res, 400, false, 'Watched is a final status and cannot be changed.');
    const allowed = { 'To Watch': ['Watching', 'Watched'], 'Watching': ['Watched', 'To Watch'] };
    if (!allowed[movie.status].includes(status)) return send(res, 400, false, `Invalid status transition: ${movie.status} cannot change to ${status}.`);
    if (status === 'Watched') {
      if (!validRating(Number(rating))) return send(res, 400, false, 'A rating from 1 to 10 is required when marking a movie as Watched.');
      movie.rating = Number(rating); movie.watchedDate = new Date();
    } else {
      if (rating !== undefined && rating !== null && rating !== '') return send(res, 400, false, 'A rating is only allowed for Watched movies.');
      movie.rating = null; movie.watchedDate = null;
    }
    movie.status = status;
    await movie.save();
    return send(res, 200, true, 'Movie status updated successfully.', movie);
  } catch (error) { next(error); }
};

exports.updateRating = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return send(res, 404, false, 'Movie not found.');
    if (movie.status !== 'Watched') return send(res, 400, false, 'Rating can only be added or edited for Watched movies.');
    const rating = Number(req.body.rating);
    if (!validRating(rating)) return send(res, 400, false, 'Rating must be a whole number from 1 to 10.');
    movie.rating = rating; await movie.save();
    return send(res, 200, true, 'Rating updated successfully.', movie);
  } catch (error) { next(error); }
};

exports.deleteMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return send(res, 404, false, 'Movie not found.');
    if (movie.status === 'Watching') return send(res, 400, false, 'Movies in Watching status cannot be deleted.');
    await movie.deleteOne();
    return send(res, 200, true, 'Movie deleted successfully.', movie);
  } catch (error) { next(error); }
};

exports.watchNext = async (req, res, next) => {
  try {
    const movie = await Movie.findOne({ status: 'To Watch' }).sort({ priority: -1, runtime: 1, createdAt: 1 });
    if (!movie) return send(res, 404, false, 'No movies are currently in To Watch status. Add a movie or change a movie status to see your next pick.');
    return send(res, 200, true, 'Here is your next movie to watch.', movie);
  } catch (error) { next(error); }
};

exports.getStats = async (req, res, next) => {
  try {
    const [statusRows, watchedSummary, genreRows] = await Promise.all([
      Movie.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Movie.aggregate([{ $match: { status: 'Watched' } }, { $group: { _id: null, count: { $sum: 1 }, totalRuntime: { $sum: '$runtime' }, averageRating: { $avg: '$rating' } } }]),
      Movie.aggregate([{ $match: { status: 'Watched' } }, { $group: { _id: '$genre', count: { $sum: 1 } } }, { $sort: { count: -1, _id: 1 } }, { $limit: 1 }])
    ]);
    const statusCounts = { 'To Watch': 0, 'Watching': 0, 'Watched': 0 };
    statusRows.forEach(row => { statusCounts[row._id] = row.count; });
    const summary = watchedSummary[0] || { count: 0, totalRuntime: 0, averageRating: null };
    const stats = {
      statusCounts,
      totalMovies: Object.values(statusCounts).reduce((a, b) => a + b, 0),
      totalHoursWatched: Math.round((summary.totalRuntime / 60) * 10) / 10,
      averageRating: summary.averageRating == null ? null : Math.round(summary.averageRating * 10) / 10,
      mostWatchedGenre: genreRows.length ? { genre: genreRows[0]._id, count: genreRows[0].count } : null
    };
    return send(res, 200, true, 'Statistics fetched successfully.', stats);
  } catch (error) { next(error); }
};
