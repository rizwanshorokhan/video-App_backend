import {
  loginUser,
  registerUser,
  LogOutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  useravatarUpdate,
  userCoverimageUpdate,
  getUserCannelProfile,
  getWatchHistory,
} from "../controllers/userController.js";
import { varifyJWT } from "../middlewares/authMiddleware.js";
import { Router } from "express";
import { upload } from "../middlewares/Multer.middleware.js";
const UserRouter = Router();

UserRouter.route("/register").post(
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

UserRouter.route("/login").post(loginUser);
// secure route
UserRouter.route("/logout").post(varifyJWT, LogOutUser);

UserRouter.route("/refreshToken").post(refreshAccessToken);

UserRouter.route("/changed-token").post(varifyJWT, changeCurrentPassword);

UserRouter.route("/currentUser").get(varifyJWT, getCurrentUser);

UserRouter.route("/update-account").patch(varifyJWT, updateAccountDetails);

UserRouter.route("/update-avatar").patch(
  varifyJWT,
  upload.single("avatar"),
  useravatarUpdate
);

UserRouter.route("/update-coverImage").patch(
  varifyJWT,
  upload.single("coverImage"),
  userCoverimageUpdate
);

UserRouter.route("/c/:username").get(varifyJWT, getUserCannelProfile);
UserRouter.route("/history").get(varifyJWT, getWatchHistory);

export default UserRouter;
