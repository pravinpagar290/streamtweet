import { Router } from "express";
import {
  getAllVideos,
  getVideoByID,
  toUploadVideo,
  updateVideoDetails,
  videoDelete,
  likeVideo,
} from "../controllers/video.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", getAllVideos);
router.get("/:videoId", getVideoByID);

router.post(
  "/upload",
  verifyToken,
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  toUploadVideo
);

router.patch(
  "/:videoId",
  verifyToken,
  upload.fields([{ name: "thumbnail", maxCount: 1 }]),
  updateVideoDetails
);

router.delete("/:videoId", verifyToken, videoDelete);

router.post("/:videoId/like", verifyToken, likeVideo);

export default router;
