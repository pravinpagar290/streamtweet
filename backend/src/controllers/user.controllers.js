import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { upload } from "../middlewares/multer.middleware.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.GetAccessToken();
    const refreshToken = user.GetRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    return {};
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { email, password, username, fullName } = req.body;

  if ([username, password, email].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All Fields Are Required");
  }

  const userExist = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (userExist) {
    throw new ApiError(409, "Username or email already exists");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  let coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  const avatar = avatarLocalPath
    ? await uploadOnCloudinary(avatarLocalPath, "image")
    : null;
  const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath, "image")
    : null;

  const user = await User.create({
    fullName: fullName,
    email: email,
    avatar: avatar?.url || "",
    coverImage: coverImage?.url || "",
    password: password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User successfully registered"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { username, password, email } = req.body;
  if (!username && !email) {
    throw new ApiError(400, "Missing email or username");
  }

  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError(400, "Username or Email not exist");
  }

  const passwordCheck = await user.isPasswordCorrect(password);

  if (!passwordCheck) {
    throw new ApiError(404, "Wrong Password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedUser = await User.findOne(user._id).select(
    "-password -refreshToken"
  );

  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
      new ApiResponse(
        200,
        { user: loggedUser, accessToken, refreshToken },
        "User Successfully Log in"
      )
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      refreshToken: undefined,
    },
    {
      new: true,
    }
  );

  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("refreshToken", option)
    .clearCookie("accessToken", option)
    .json(new ApiResponse(200, {}, "User Successfully log Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRequestToken =
    req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingRequestToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedRefreshToken = await jwt.verify(
      incomingRequestToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedRefreshToken?._id);

    if (!user) {
      throw new ApiError(401, "invalid refresh token ");
    }

    if (incomingRequestToken !== user?.refreshToken) {
      throw new ApiError(401, "refresh token is invalid or used");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

    const option = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, option)
      .cookie("refreshToken", refreshToken, option)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "The Access Token Is Refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error.message || "Something went wrong");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { currentPassword, email, username, newPassword } = req.body;

  if (!newPassword) {
    throw new ApiError(400, "New password is required");
  }
  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError(401, "Unauthorize User");
  }

  const checkPassword = await user.isPasswordCorrect(currentPassword);

  if (!checkPassword) {
    throw new ApiError(400, "Password not valid");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Has been changed"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email: email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const changeAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image path needed");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath, "image");

  if (!avatar) {
    throw new ApiError(400, "Wrong Avatar path");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar image updated successfully"));
});

const getUserProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username) {
    throw new ApiError(400, "Username required");
  }

  const channel = await User.findOne({ username })
    .select("username fullName avatar coverImage _id")
    .lean();
  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  const subscriberCount =
    (channel.subscribers && Array.isArray(channel.subscribers)
      ? channel.subscribers.length
      : channel.subscriberCount) || 0;

  return res
    .status(200)
    .json(new ApiResponse(200, { channel, subscriberCount }, "Channel found"));
});

const getUserHistory = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Authentication required");
  }

  const user = await User.findById(req.user._id).populate({
    path: "watchHistory.video",
    select: "title thumbnail owner views description createdAt",
    populate: { path: "owner", select: "username avatar" },
  });

  const entries = user?.watchHistory || [];
  const latestByVideo = new Map();
  for (const entry of entries) {
    const videoObj = entry.video ? entry.video.toObject() : null;
    if (!videoObj) continue;
    const vid = videoObj._id?.toString();
    const existing = latestByVideo.get(vid);
    if (!existing || new Date(entry.watchedAt) > new Date(existing.watchedAt)) {
      latestByVideo.set(vid, { ...videoObj, watchedAt: entry.watchedAt });
    }
  }
  const raw = Array.from(latestByVideo.values()).sort(
    (a, b) => new Date(b.watchedAt) - new Date(a.watchedAt)
  );

  return res
    .status(200)
    .json(new ApiResponse(200, raw, "Watch history fetched successfully"));
});

export {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  changeCurrentPassword,
  changeAvatar,
  updateAccountDetails,
  getUserProfile,
  getUserHistory,
};
