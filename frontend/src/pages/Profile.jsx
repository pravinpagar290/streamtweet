import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../Auth/AuthContext";

export default function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isLoggedIn } = useAuth();

  const [channel, setChannel] = useState(null);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subLoading, setSubLoading] = useState(false);
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      const targetUsername = username ?? currentUser?.username;
      if (!targetUsername) {
        if (!isLoggedIn) {
          setLoading(false);
          setError(
            "No channel specified. Please login or visit a channel URL."
          );
          return;
        }
        setLoading(false);
        setError("Unable to determine channel username.");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const resPublic = await api.get(`/user/c/${targetUsername}`);
        if (resPublic?.data?.data) {
          setChannel(resPublic.data.data.channel);
          setSubscriberCount(resPublic.data.data.subscriberCount ?? 0);
        } else {
          setChannel(null);
          setError("Channel not found.");
        }

        if (isLoggedIn) {
          try {
            const resProtected = await api.get(
              `/user/channel/${targetUsername}`
            );
            if (resProtected?.data?.data) {
              setIsSubscribed(!!resProtected.data.data.isSubscribed);
              setSubscriberCount(
                resProtected.data.data.subscriberCount ?? subscriberCount
              );
            }
          } catch (err) {
            // ignore protected fetch errors silently
          }
        }

        try {
          const vidRes = await api.get("/video/");
          const allVideos = vidRes?.data?.data ?? [];
          const channelVideos = allVideos.filter(
            (v) => v.owner?.username === targetUsername
          );
          setVideos(channelVideos);
        } catch (err) {
          setVideos([]);
        }
      } catch (err) {
        console.error("Failed to load channel", err);
        setChannel(null);
        setError(err?.response?.data?.message || "Failed to load channel");
      } finally {
        setLoading(false);
      }
    })();
  }, [username, currentUser, isLoggedIn]);

  const handleToggleSubscribe = async () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    if (!channel) return;
    try {
      setSubLoading(true);
      if (isSubscribed) {
        const res = await api.post(`/user/unsubscribe/${channel.username}`);
        setIsSubscribed(false);
        setSubscriberCount(
          res?.data?.data?.subscriberCount ?? Math.max(0, subscriberCount - 1)
        );
      } else {
        const res = await api.post(`/user/subscribe/${channel.username}`);
        setIsSubscribed(true);
        setSubscriberCount(
          res?.data?.data?.subscriberCount ?? subscriberCount + 1
        );
      }
    } catch (err) {
      console.error("Subscribe action failed", err);
    } finally {
      setSubLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-white text-center p-10">Loading channel...</div>
    );
  }

  if (error) {
    return <div className="text-red-400 text-center p-10">{error}</div>;
  }

  if (!channel) {
    return (
      <div className="text-gray-400 text-center p-10">Channel not found.</div>
    );
  }

  const isOwner = currentUser?._id === channel._id;

  return (
    <div className="max-w-5xl mx-auto text-white p-6">
      <div className="flex items-center gap-6">
        <img
          src={channel.avatar || "/vite.svg"}
          alt={channel.username}
          className="w-24 h-24 rounded-full object-cover"
        />
        <div>
          <h1 className="text-2xl font-bold">
            {channel.fullName || channel.username}
          </h1>
          <div className="text-gray-400">@{channel.username}</div>
          <div className="text-gray-400 mt-2">
            {subscriberCount} subscribers
          </div>
        </div>

        <div className="ml-auto">
          {!isOwner && (
            <button
              onClick={handleToggleSubscribe}
              disabled={subLoading}
              className={`px-4 py-2 rounded-md font-semibold ${
                isSubscribed ? "bg-gray-700" : "bg-red-600 hover:bg-red-700"
              } `}
            >
              {subLoading
                ? "Please wait..."
                : isSubscribed
                ? "Subscribed"
                : "Subscribe"}
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 bg-gray-800 p-4 rounded-md">
        <h2 className="font-semibold mb-2">About</h2>
        <p className="text-gray-300">
          {channel.coverImage ? "Has cover image" : "No cover image"}
        </p>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Videos</h2>
        {videos.length === 0 ? (
          <div className="text-gray-400">No videos yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {videos.map((v) => (
              <a key={v._id} href={`/video/${v._id}`} className="block group">
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                  <img
                    src={v.thumbnail || "/vite.svg"}
                    alt={v.title}
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-3">
                    <h3 className="font-semibold text-sm line-clamp-2">
                      {v.title}
                    </h3>
                    <p className="text-gray-400 text-xs mt-1">
                      {v.views || 0} views
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
