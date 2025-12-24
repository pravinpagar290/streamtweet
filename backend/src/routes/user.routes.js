import { Router } from "express";
import {
  loginUser,
  logOutUser,
  registerUser,
  refreshAccessToken,
  changeCurrentPassword,
  changeAvatar,
  updateAccountDetails,
  getUserProfile,
  getUserHistory,
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
  subscribeToChannel,
  unsubscribeFromChannel,
  getChannelInfo,
} from "../controllers/subscription.controllers.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

router.route("/logout").post(verifyToken, logOutUser);

router.route("/refresh-token").post(refreshAccessToken);

router.route("/change-password").post(verifyToken, changeCurrentPassword);

router
  .route("/change-current-password")
  .post(verifyToken, changeCurrentPassword);

router
  .route("/change-avatar")
  .patch(verifyToken, upload.single("avatar"), changeAvatar);

router
  .route("/update-account-details")
  .patch(verifyToken, updateAccountDetails);

// public channel info (profile page)
router.route("/c/:username").get(getUserProfile);

// protected channel info (includes isSubscribed for current user)
router.get("/channel/:username", verifyToken, getChannelInfo);

router.route("/history").get(verifyToken, getUserHistory);

router.post("/subscribe/:username", verifyToken, subscribeToChannel);
router.post("/unsubscribe/:username", verifyToken, unsubscribeFromChannel);

export default router;
