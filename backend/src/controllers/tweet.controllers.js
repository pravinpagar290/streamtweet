import mongoose from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!tweetId) {
    throw new ApiError(400, "Tweet ID is required");
  }

  if (!mongoose.isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet ID format");
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  // Ensure only owner can delete
  if (!tweet.owner || tweet.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized to delete this tweet");
  }

  await tweet.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet deleted successfully"));
});

const createTweet = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { content } = req.body;

  if (!content || content.trim() === "") {
    throw new ApiError(400, "Content is required to create a tweet");
  }

  // Await creation and populate owner before returning
  const newTweet = await Tweet.create({
    content,
    owner: userId,
  });
  await newTweet.populate("owner", "username");

  return res
    .status(201)
    .json(new ApiResponse(201, newTweet, "Tweet created successfully"));
});

const getTweets = asyncHandler(async (req, res) => {
  const tweets = await Tweet.find().populate("owner", "username");
  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "Tweets fetched successfully"));
});

const likeTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!tweetId) {
    throw new ApiError(400, "Tweet ID is required");
  }

  if (!mongoose.isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid Tweet ID format");
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  // Ensure user is available (route is protected)
  const userId = req.user._id;

  // Normalize likedBy
  tweet.likedBy = tweet.likedBy || [];

  const alreadyLiked = tweet.likedBy.some(
    (id) => id.toString() === userId.toString()
  );

  if (alreadyLiked) {
    // Unlike
    tweet.likedBy = tweet.likedBy.filter(
      (id) => id.toString() !== userId.toString()
    );
  } else {
    // Like
    tweet.likedBy.push(userId);
  }

  // keep likesCount consistent with likedBy length
  tweet.likesCount = tweet.likedBy.length;

  await tweet.save();

  const updatedTweet = await Tweet.findById(tweetId).populate(
    "owner",
    "username"
  );

  // Convert to plain object and annotate with liked boolean for the caller
  const out = updatedTweet.toObject();
  out.liked = out.likedBy?.some((id) => id.toString() === userId.toString());

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        out,
        alreadyLiked ? "Tweet unliked successfully" : "Tweet liked successfully"
      )
    );
});

export { deleteTweet, createTweet, getTweets, likeTweet };
