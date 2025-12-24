import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { placeholderDataUrl } from "../utils/placeholder";

function WatchHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get("/user/history");

        if (response.data && response.data.data) {
          const sorted = response.data.data.sort(
            (a, b) => new Date(b.watchedAt) - new Date(a.watchedAt)
          );
          setHistory(sorted);
        }
      } catch (err) {
        console.error("Error fetching watch history:", err);
        setError(
          err.response?.data?.message ||
            "Failed to load history. Please log in."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="text-white text-center p-10">Loading history...</div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-10">{error}</div>;
  }

  if (history.length === 0) {
    return (
      <div className="text-gray-400 text-center p-10">
        Your watch history is empty.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto text-white">
      <h1 className="text-3xl font-bold mb-6 border-b border-gray-700 pb-2">
        Watch History
      </h1>
      <div className="space-y-4">
        {history.map((video) => (
          <HistoryVideoCard
            key={`${video._id}-${video.watchedAt}`}
            video={video}
          />
        ))}
      </div>
    </div>
  );
}

function HistoryVideoCard({ video }) {
  if (!video) return null;

  const watchedDate = video.watchedAt
    ? new Date(video.watchedAt).toLocaleString()
    : "Unknown";

  return (
    <Link
      to={`/video/${video._id}`}
      className="flex items-start gap-4 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
    >
      <img
        src={video.thumbnail || placeholderDataUrl(160, 90, "No Image")}
        alt={video.title}
        className="w-40 h-24 rounded-md object-cover flex-shrink-0"
      />

      <div className="flex-grow">
        <h3 className="text-lg font-semibold line-clamp-2">
          {video.title || "Untitled Video"}
        </h3>
        <p className="text-sm text-gray-400 mt-1">
          {video.owner?.username || "Unknown Uploader"}
        </p>
        <p className="text-sm text-gray-400 mt-2 line-clamp-2">
          {video.description || "No description."}
        </p>
        <p className="text-xs text-gray-500 mt-2">Watched: {watchedDate}</p>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="text-sm text-gray-400">{video.views || 0} views</p>
      </div>
    </Link>
  );
}

export default WatchHistory;
