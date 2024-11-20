import { loginUser, registerUser, LogOutUser,refreshAccessToken } from "../controllers/userController.js"
import { varifyJWT } from "../middlewares/authMiddleware.js";
import { Router } from "express";
import { upload } from "../middlewares/Multer.middleware.js";
const UserRouter = Router()

UserRouter.route('/register').post(
   upload.fields([
      {
      name:"avatar",
      maxCount:1,
      },
      {
         name:"coverImage",
         maxCount:1
      }
   ]),
   registerUser);

UserRouter.route('/login').post(loginUser);
// secure route
UserRouter.route('/logout').post(varifyJWT,LogOutUser)
UserRouter.route('/refreshToken').post(refreshAccessToken)

export default UserRouter;