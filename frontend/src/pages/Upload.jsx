import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

function Upload() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !description || !videoFile) {
      setError("Title, description, and a video file are required.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("videoFile", videoFile);

    if (thumbnail) {
      formData.append("thumbnail", thumbnail);
    }

    try {
      const response = await api.post("/video/upload", formData, {});

      if (response.status === 200) {
        setSuccess("Video uploaded successfully! Redirecting to home...");
        setTitle("");
        setDescription("");
        setVideoFile(null);
        setThumbnail(null);
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
    } catch (err) {
      console.error("Upload failed:", err);
      setError(
        err.response?.data?.message || "Upload failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl w-full mx-auto bg-gray-800 p-6 sm:p-8 rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-center text-white">
        Upload Video
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-300"
          >
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-300"
          >
            Description
          </label>
          <textarea
            id="description"
            rows="4"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          />
        </div>

        <div>
          <label
            htmlFor="videoFile"
            className="block text-sm font-medium text-gray-300"
          >
            Video File <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            id="videoFile"
            accept="video/*"
            onChange={(e) => setVideoFile(e.target.files[0])}
            className="mt-1 block w-full text-sm text-gray-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-600 file:text-white
              hover:file:bg-blue-700
              disabled:opacity-50"
            disabled={loading}
          />
        </div>

        <div>
          <label
            htmlFor="thumbnail"
            className="block text-sm font-medium text-gray-300"
          >
            Thumbnail (Optional)
          </label>
          <input
            type="file"
            id="thumbnail"
            accept="image/*"
            onChange={(e) => setThumbnail(e.target.files[0])}
            className="mt-1 block w-full text-sm text-gray-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-gray-600 file:text-white
              hover:file:bg-gray-500
              disabled:opacity-50"
            disabled={loading}
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm text-center">{error}</div>
        )}
        {success && (
          <div className="text-green-500 text-sm text-center">{success}</div>
        )}

        <div>
          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Uploading...
              </div>
            ) : (
              "Upload Video"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Upload;
