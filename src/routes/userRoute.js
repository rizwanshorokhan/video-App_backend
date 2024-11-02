import { loginUser, registerUser } from "../controllers/userController.js"
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
   registerUser)
UserRouter.route('/login').post(loginUser)

export default UserRouter;
