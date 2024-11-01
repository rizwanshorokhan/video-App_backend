import { loginUser, registerUser } from "../controllers/userController.js"
import { Router } from "express";

const UserRouter = Router()

UserRouter.route('/register').post(registerUser)
UserRouter.route('/login').post(loginUser)

export default UserRouter;
