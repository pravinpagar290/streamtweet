import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import ReactPlayer from "react-player";
import { useAuth } from "../Auth/AuthContext";
import { placeholderDataUrl } from "../utils/placeholder";

const HeartPop = ({ show }) => (
  <span
    className={`absolute -top-2 -right-2 text-red-500 text-xl transition-all duration-500 \
                ${show ? "opacity-100 scale-125" : "opacity-0 scale-0"}`}
  >
    ❤
  </span>
);

const CopiedBadge = ({ show }) => (
  <div
    className={`absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded \
                bg-green-500 text-white text-xs transition-all \
                ${
                  show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                }`}
  >
    Copied!
  </div>
);

const PlayerSkeleton = () => (
  <div className="w-full aspect-video bg-gray-800 rounded-xl overflow-hidden animate-pulse" />
);

const RecSkeleton = () => (
  <div className="flex gap-3 animate-pulse">
    <div className="w-40 h-24 bg-gray-800 rounded-lg shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-800 rounded" />
      <div className="h-3 bg-gray-800 rounded w-2/3" />
    </div>
  </div>
);

export default function VideoDetail() {
  const { videoId } = useParams();
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const playerRef = useRef(null);
  const observerRef = useRef(null);

  const [video, setVideo] = useState(null);
  const [likeLoading, setLikeLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [playing, setPlaying] = useState(false);
  const [playerError, setPlayerError] = useState(null);

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [subLoading, setSubLoading] = useState(false);

  const [recommendedVideos, setRecommendedVideos] = useState([]);
  const [recLoading, setRecLoading] = useState(false);

  const [hasRecordedView, setHasRecordedView] = useState(false);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/video/${videoId}`);
        if (!cancelled && data?.data) {
          setVideo(data.data);
          setLiked(data.data.liked);
        }
      } catch (e) {
        setError(e.response?.data?.message || "Failed to fetch video.");
      } finally {
        setLoading(false);
      }
    })();
    return () => (cancelled = true);
  }, [videoId]);

  useEffect(() => {
    (async () => {
      setRecLoading(true);
      try {
        const { data } = await api.get("/video/");
        const list = (data?.data || [])
          .filter((v) => v._id !== videoId)
          .slice(0, 12);
        setRecommendedVideos(list);
      } catch {
        setRecommendedVideos([]);
      } finally {
        setRecLoading(false);
      }
    })();
  }, [videoId]);

  useEffect(() => {
    if (!video?.owner?.username) return;
    (async () => {
      try {
        const { data } = await api.get(`/user/channel/${video.owner.username}`);
        setIsSubscribed(!!data?.data?.isSubscribed);
        setSubscriberCount(data?.data?.subscriberCount || 0);
      } catch {}
    })();
  }, [video]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT") return;
      if (e.code === "Space") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
      if (e.code === "KeyM") {
        playerRef.current?.getInternalPlayer()?.muted
          ? (playerRef.current.getInternalPlayer().muted = false)
          : (playerRef.current.getInternalPlayer().muted = true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleLike = async () => {
    if (!isLoggedIn) return navigate("/login");
    setLikeLoading(true);
    try {
      const { data } = await api.post(`/video/${videoId}/like`);
      setVideo(data.data);
      setLiked(data.data.liked);
    } finally {
      setLikeLoading(false);
    }
  };

  const toggleSubscribe = async () => {
    if (!isLoggedIn) return navigate("/login");
    const un = video.owner.username;
    setSubLoading(true);
    try {
      if (isSubscribed) {
        const { data } = await api.post(`/user/unsubscribe/${un}`);
        setIsSubscribed(false);
        setSubscriberCount(data?.data?.subscriberCount ?? 0);
      } else {
        const { data } = await api.post(`/user/subscribe/${un}`);
        setIsSubscribed(true);
        setSubscriberCount(data?.data?.subscriberCount ?? 0);
      }
    } finally {
      setSubLoading(false);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleStart = () => {
    if (!hasRecordedView && isLoggedIn) {
      setHasRecordedView(true);
    }
  };

  useEffect(() => {
    if (!observerRef.current) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => en.isIntersecting && en.target.play()),
      { threshold: 0.6 }
    );
    const els = observerRef.current.querySelectorAll("video");
    els.forEach((v) => io.observe(v));
    return () => io.disconnect();
  }, [recommendedVideos]);

  if (loading)
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
          <div className="flex-grow space-y-4">
            <PlayerSkeleton />
            <div className="h-6 bg-gray-800 rounded w-2/3 animate-pulse" />
            <div className="h-4 bg-gray-800 rounded w-1/3 animate-pulse" />
          </div>
          <aside className="w-full lg:w-96 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <RecSkeleton key={i} />
            ))}
          </aside>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-red-400">
        <div className="text-center">
          <p className="text-xl mb-4">{error}</p>
          <Link to="/" className="text-blue-400 hover:underline">
            Go home
          </Link>
        </div>
      </div>
    );

  if (!video || !video.videoFile)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Video unavailable
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl animate-fadeIn">
              <ReactPlayer
                ref={playerRef}
                url={video.videoFile}
                playing={playing}
                controls
                width="100%"
                height="100%"
                light={video.thumbnail}
                onStart={handleStart}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onError={(e) => {
                  console.error(e);
                  setPlayerError("Playback failed.");
                }}
                config={{
                  file: { attributes: { controlsList: "nodownload" } },
                }}
              />
              {playerError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-red-400">
                  {playerError}
                </div>
              )}
            </div>

            <div className="space-y-4 animate-slideUp">
              <h1 className="text-2xl md:text-3xl font-bold">{video.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                <span>{video.views || 0} views</span>
                <span>•</span>
                <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                <div className="relative">
                  <button
                    onClick={toggleLike}
                    disabled={likeLoading}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition ${
                      liked
                        ? "bg-red-600 text-white"
                        : "bg-gray-800 hover:bg-gray-700"
                    }`}
                  >
                    {likeLoading ? "…" : "👍"} Like
                  </button>
                  <HeartPop show={liked} />
                </div>
                <button
                  onClick={copyLink}
                  className="relative px-3 py-1.5 rounded-full bg-gray-800 hover:bg-gray-700"
                >
                  Share
                  <CopiedBadge show={copied} />
                </button>
              </div>

              <div className="flex items-center justify-between bg-gray-800/50 backdrop-blur rounded-xl p-4">
                <Link
                  to={`/c/${video.owner.username}`}
                  className="flex items-center gap-4 group"
                >
                  <img
                    src={
                      video.owner.avatar ||
                      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="100%" height="100%" fill="%231f2937"/><text x="50%" y="50%" fill="%239ca3af" dominant-baseline="middle" text-anchor="middle">U</text></svg>'
                    }
                    alt=""
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold group-hover:text-blue-400">
                      {video.owner.username}
                    </p>
                    <p className="text-xs text-gray-400">
                      {subscriberCount} subscribers
                    </p>
                  </div>
                </Link>
                <button
                  onClick={toggleSubscribe}
                  disabled={subLoading}
                  className={`px-4 py-2 rounded-full font-semibold transition ${
                    isSubscribed
                      ? "bg-gray-700 text-white"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {subLoading ? "…" : isSubscribed ? "Subscribed" : "Subscribe"}
                </button>
              </div>

              <details className="bg-gray-800/50 backdrop-blur rounded-xl p-4">
                <summary className="cursor-pointer font-semibold">
                  Description
                </summary>
                <p className="text-gray-300 mt-2 whitespace-pre-wrap">
                  {video.description || "No description provided."}
                </p>
              </details>
            </div>
          </div>

          <aside className="space-y-3 animate-slideUp" ref={observerRef}>
            <h2 className="text-lg font-semibold">Up next</h2>
            {recLoading ? (
              Array.from({ length: 6 }).map((_, i) => <RecSkeleton key={i} />)
            ) : recommendedVideos.length ? (
              recommendedVideos.map((v, idx) => (
                <RecommendedCard key={v._id} video={v} delay={idx * 80} />
              ))
            ) : (
              <p className="text-gray-400 text-sm">No recommendations</p>
            )}
          </aside>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
        .animate-slideUp {
          animation: slideUp 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

function RecommendedCard({ video, delay }) {
  const title = video.title || "Untitled";
  const thumb = video.thumbnail || placeholderDataUrl(168, 94, "No Image");
  const uploader = video.owner?.username || "Unknown";
  const views = Intl.NumberFormat("en", { notation: "compact" }).format(
    video.views || 0
  );

  return (
    <Link
      to={`/video/${video._id}`}
      className="flex gap-3 p-2 rounded-lg hover:bg-gray-800/60 transition backdrop-blur opacity-0 animate-slideUp"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      <div className="relative w-40 h-24 rounded-lg overflow-hidden shrink-0 bg-gray-900">
        <video
          src={video.videoFile}
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          onMouseOver={(e) => e.target.play()}
          onMouseOut={(e) => e.target.pause()}
        />
        <img
          src={thumb}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0"
        />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold line-clamp-2">{title}</h3>
        <p className="text-xs text-gray-400 mt-1">{uploader}</p>
        <p className="text-xs text-gray-500">{views} views</p>
      </div>
    </Link>
  );
}
