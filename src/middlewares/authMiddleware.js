import jwt from 'jsonwebtoken';
import { User } from "../models/User.model.js";
import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';

export const varifyJWT = asyncHandler(async(req,res,next)=>{
   try {
      const token = req.cookies?.accessToken || req.header("Autherization")?.replace("Bearer ","")
      if(!token){
         throw new ApiError(401,"Unautherized request")
      }
      
      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
      const user = await User.findById(decodedToken?._id).select('-password -refreshToken')
      if(!user){
         throw new ApiError(401,"Invalid Access Token")
      }
      req.user = user
      next()
   } catch (error) {
      throw new ApiError(401,error?.message||"Invalid auth token")
   }
})