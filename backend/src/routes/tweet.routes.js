import { Router } from "express";
import {
  deleteTweet,
  getTweets,
  likeTweet,
  createTweet,
} from "../controllers/tweet.controllers.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", verifyToken, createTweet);
router.get("/", getTweets);
router.post("/:tweetId/like", verifyToken, likeTweet);
router.delete("/:tweetId", verifyToken, deleteTweet);

export default router;
