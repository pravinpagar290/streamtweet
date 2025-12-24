import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { placeholderDataUrl } from "../utils/placeholder";

const SkeletonCard = () => (
  <div className="w-full rounded-xl overflow-hidden bg-gray-800 animate-pulse">
    <div className="w-full h-40 bg-gray-700" />
    <div className="p-4 space-y-2">
      <div className="h-4 bg-gray-700 rounded" />
      <div className="h-3 bg-gray-700 rounded w-2/3" />
      <div className="h-3 bg-gray-700 rounded w-1/3" />
    </div>
  </div>
);

function VideoCard({ video }) {
  const [thumbLoaded, setThumbLoaded] = useState(false);

  const title = video.title || "Untitled Video";
  const thumb = video.thumbnail || placeholderDataUrl(320, 180, "No Image");
  const author = video.owner?.username || "Unknown Uploader";
  const views = Intl.NumberFormat("en", { notation: "compact" }).format(
    video.views || 0
  );

  return (
    <Link
      to={`/video/${video._id}`}
      className="group block rounded-xl overflow-hidden shadow-lg
                 bg-gray-800 ring-1 ring-white/10
                 hover:ring-2 hover:ring-blue-400
                 transition-all duration-300 hover:-translate-y-1"
    >
      <div className="relative w-full pt-[56.25%] bg-gray-900">
        {!thumbLoaded && (
          <div className="absolute inset-0 bg-gray-700 animate-pulse" />
        )}
        <img
          src={thumb}
          alt={title}
          onLoad={() => setThumbLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover
                     transition-opacity duration-500
                     ${thumbLoaded ? "opacity-100" : "opacity-0"}`}
        />
      </div>

      <div className="p-3 text-white">
        <h3
          className="font-semibold text-sm line-clamp-2
                     group-hover:text-blue-300 transition"
          title={title}
        >
          {title}
        </h3>

        <p className="text-gray-400 text-xs mt-1">{author}</p>

        <p className="text-gray-500 text-xs mt-1">{views} views</p>
      </div>
    </Link>
  );
}

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await api.get("/video/");
        if (!cancelled) setVideos(data?.data || []);
      } catch (e) {
        if (!cancelled) setError("Failed to load videos. Try again later.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => (cancelled = true);
  }, []);

  if (loading)
    return (
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-400">
        {error}
      </div>
    );

  if (!videos.length)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        No videos yet.
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
        {videos.map((v) => (
          <VideoCard key={v._id} video={v} />
        ))}
      </div>
    </div>
  );
}
