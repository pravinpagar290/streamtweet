import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

export const toUploadVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title?.trim() || !description?.trim()) {
    throw new ApiError(400, "Title and description are required");
  }

  const videoFile = req.files?.videoFile?.[0];
  const thumbnailFile = req.files?.thumbnail?.[0];

  if (!videoFile) {
    throw new ApiError(400, "Video file is required");
  }

  if (!videoFile.originalname.endsWith(".mp4")) {
    throw new ApiError(400, "Only MP4 videos are allowed");
  }

  const uploadedVideo = await uploadOnCloudinary(videoFile.path, "video");
  const videoUrl = uploadedVideo?.secure_url || uploadedVideo?.url;
  if (!videoUrl) {
    throw new ApiError(400, "Failed to upload video to Cloudinary");
  }

  const uploadedThumbnail = thumbnailFile
    ? await uploadOnCloudinary(thumbnailFile.path, "image")
    : null;
  const thumbnailUrl =
    uploadedThumbnail?.secure_url || uploadedThumbnail?.url || "";

  const videoData = await Video.create({
    videoFile: videoUrl,
    thumbnail: thumbnailUrl,
    title,
    description,
    duration: uploadedVideo.duration || 0,
    owner: req.user._id,
    isPublished: true,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, videoData, "Video uploaded successfully"));
});

export const getVideoByID = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID format");
  }

  const video = await Video.findById(videoId)
    .populate("owner", "username avatar email")
    .lean();
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (!video.videoFile || typeof video.videoFile !== "string") {
    throw new ApiError(500, "Video URL missing or invalid");
  }

  let requesterId = req.user?._id ?? null;
  if (!requesterId) {
    try {
      let token = null;
      const authHeader = req.headers?.authorization;
      if (
        authHeader &&
        typeof authHeader === "string" &&
        authHeader.startsWith("Bearer ")
      ) {
        token = authHeader.split(" ")[1];
      } else if (req.cookies?.accessToken) {
        token = req.cookies.accessToken;
      }
      if (token) {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (decoded && decoded._id) requesterId = decoded._id;
      }
    } catch (err) {
      requesterId = null;
    }
  }

  if (requesterId) {
    Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } }).catch((err) =>
      console.warn("Failed to increment views:", err)
    );
    User.findByIdAndUpdate(
      requesterId,
      {
        $push: {
          watchHistory: {
            video: videoId,
            watchedAt: new Date(),
          },
        },
      },
      { new: false }
    ).catch((err) => console.warn("Failed to record watch history:", err));
  } else {
    Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } }).catch((err) =>
      console.warn("Failed to increment views:", err)
    );
  }

  if (requesterId && video.likedBy) {
    video.liked = video.likedBy.some(
      (id) => id.toString() === requesterId.toString()
    );
  } else {
    video.liked = false;
  }

  return res.status(200).json(new ApiResponse(200, video, "Video found"));
});

export const likeVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }
  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID format");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const userId = req.user._id;
  video.likedBy = video.likedBy || [];
  const alreadyLiked = video.likedBy.some(
    (id) => id.toString() === userId.toString()
  );

  if (alreadyLiked) {
    video.likedBy = video.likedBy.filter(
      (id) => id.toString() !== userId.toString()
    );
  } else {
    video.likedBy.push(userId);
  }

  video.likesCount = video.likedBy.length;
  await video.save();

  const updated = await Video.findById(videoId)
    .populate("owner", "username avatar")
    .lean();
  const out = {
    ...updated,
    liked: updated.likedBy?.some((id) => id.toString() === userId.toString()),
  };

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        out,
        alreadyLiked ? "Video unliked successfully" : "Video liked successfully"
      )
    );
});

export const getAllVideos = asyncHandler(async (req, res) => {
  const videos = await Video.find({ isPublished: true })
    .sort({ createdAt: -1 })
    .populate("owner", "username avatar");

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

export const updateVideoDetails = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID format");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const thumbnailFile = req.files?.thumbnail?.[0];
  let newThumbnail = null;

  if (thumbnailFile) {
    newThumbnail = await uploadOnCloudinary(thumbnailFile.path);
    video.thumbnail = newThumbnail.url;
  }

  if (title !== undefined) video.title = title;
  if (description !== undefined) video.description = description;

  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video updated successfully"));
});

export const videoDelete = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID format");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  await video.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"));
});
