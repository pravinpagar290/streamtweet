import React from "react";
import api from "../api/axios";
import { useAuth } from "../Auth/AuthContext";

const Tweet = () => {
  const [content, setContent] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [likesCount, setLikesCount] = React.useState(0);

  // new state
  const [tweets, setTweets] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const { user: currentUser } = useAuth();

  // fetch tweets on mount
  React.useEffect(() => {
    const fetchTweets = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/tweet"); // backend path: /api/v1/tweet
        const data = res.data?.data ?? []; // ApiResponse -> data field
        // If logged in, annotate 'liked' by checking likedBy array
        const processed = Array.isArray(data)
          ? data.map((t) => ({
              ...t,
              liked: currentUser
                ? (t.likedBy ?? []).some(
                    (id) =>
                      id === currentUser._id ||
                      id === currentUser._id?.toString()
                  )
                : false,
            }))
          : [];
        setTweets(processed);
      } catch (err) {
        setError("Failed to load tweets");
      } finally {
        setLoading(false);
      }
    };
    fetchTweets();
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post("/tweet", { content: content.trim() });
      let created = res.data?.data;
      // ensure created tweet has liked flag
      if (created)
        created = { ...created, liked: false, likedBy: created.likedBy ?? [] };
      if (created) setTweets((prev) => [created, ...prev]);
      setContent("");
    } catch (err) {
      const status = err?.response?.status;
      const serverMsg =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        err?.normalizedMessage;
      if (status === 401) {
        setError("Unauthorized. Please log in to post a tweet.");
      } else if (status === 409) {
        setError(serverMsg || "Conflict: could not create tweet.");
      } else {
        setError(serverMsg || "Failed to post tweet");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (tweetId) => {
    try {
      const res = await api.post(`/tweet/${tweetId}/like`);
      const updated = res.data?.data;
      if (updated) {
        // updated now contains liked and updated likedBy/likesCount
        setTweets((prev) =>
          prev.map((t) => (t._id === updated._id ? updated : t))
        );
      } else {
        // fallback (should rarely happen now)
        setTweets((prev) =>
          prev.map((t) => {
            if (t._id !== tweetId) return t;
            const liked = !t.liked;
            const likes = (t.likesCount ?? t.likes ?? 0) + (liked ? 1 : -1);
            return { ...t, liked, likesCount: likes };
          })
        );
      }
    } catch (err) {
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.message ?? err?.normalizedMessage;
      if (status === 401) {
        setError("Unauthorized. Please log in to like tweets.");
      } else if (status === 409) {
        setError(serverMsg || "Conflict while liking tweet.");
      } else {
        setError(serverMsg || "Failed to like tweet");
      }
    }
  };

  const handleDelete = async (tweetId) => {
    if (!window.confirm("Delete this tweet?")) return;
    try {
      await api.delete(`/tweet/${tweetId}`);
      setTweets((prev) => prev.filter((t) => t._id !== tweetId));
    } catch (err) {
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.message ?? err?.normalizedMessage;
      if (status === 401) {
        setError("Unauthorized. Please log in to delete this tweet.");
      } else if (status === 409) {
        setError(serverMsg || "Conflict while deleting tweet.");
      } else {
        setError(serverMsg || "Failed to delete tweet");
      }
    }
  };

  const formatTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleString();
  };

  return (
    <div style={{ maxWidth: 700, margin: "24px auto", padding: 12 }}>
      <h2>Compose Tweet</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's happening?"
          maxLength={280}
          rows={4}
          style={{ width: "100%", padding: 8, fontSize: 14 }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 8,
          }}
        >
          <small>{content.length}/280</small>
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            style={{ padding: "8px 12px" }}
          >
            {submitting ? "Posting…" : "Tweet"}
          </button>
        </div>
      </form>

      {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}
      {loading ? (
        <div>Loading tweets…</div>
      ) : (
        <>
          {tweets.length === 0 ? (
            <div>No tweets yet.</div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {tweets.map((tweet) => (
                <li
                  key={tweet._id}
                  style={{
                    border: "1px solid #ddd",
                    padding: 12,
                    marginBottom: 8,
                    borderRadius: 6,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <div>
                      <strong>
                        {tweet.owner?.username ?? tweet.owner ?? "Unknown"}
                      </strong>
                      <div style={{ fontSize: 12, color: "#666" }}>
                        {formatTime(tweet.createdAt ?? tweet.created_at)}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <button
                        onClick={() => handleLike(tweet._id)}
                        style={{ marginRight: 8 }}
                      >
                        {tweet.liked ? "Unlike" : "Like"}
                      </button>
                      <span>{tweet.likesCount ?? tweet.likes ?? 0}</span>
                    </div>
                  </div>
                  <div style={{ whiteSpace: "pre-wrap" }}>{tweet.content}</div>
                  {(tweet.canDelete || tweet.isOwner || tweet.own) && (
                    <div style={{ marginTop: 8 }}>
                      <button
                        onClick={() => handleDelete(tweet._id)}
                        style={{ color: "red" }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
};

export default Tweet;
