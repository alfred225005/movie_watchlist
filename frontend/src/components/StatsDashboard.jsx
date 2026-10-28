
import React from 'react';

function StatsDashboard({ stats }) {
  if (!stats) {
    return (
      <section className="stats-dashboard">
        <h2>Movie Statistics</h2>
        <p>Loading statistics...</p>
      </section>
    );
  }

  const statusCounts = stats.statusCounts || {};
  const totalHours = stats.totalHoursWatched ?? 0;
  const averageRating = stats.averageRating ?? 0;
  const topGenre = stats.topGenre || 'No data yet';

  return (
    <section className="stats-dashboard">
      <h2>Movie Statistics</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>To Watch</h3>
          <p>{statusCounts['To Watch'] ?? 0}</p>
        </div>

        <div className="stat-card">
          <h3>Watching</h3>
          <p>{statusCounts['Watching'] ?? 0}</p>
        </div>

        <div className="stat-card">
          <h3>Watched</h3>
          <p>{statusCounts['Watched'] ?? 0}</p>
        </div>

        <div className="stat-card">
          <h3>Hours Watched</h3>
          <p>{totalHours}</p>
        </div>

        <div className="stat-card">
          <h3>Average Rating</h3>
          <p>{Number(averageRating).toFixed(1)} / 10</p>
        </div>

        <div className="stat-card">
          <h3>Top Genre</h3>
          <p>{topGenre}</p>
        </div>
      </div>
    </section>
  );
}

export default StatsDashboard;
