import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/User.model.js";
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.mjs';
// generate access and refresh toke
const generateAccessRefreshToken = async(userId)=>{
   try {
      const user = await User.findById(userId)
      const accessToken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()
      user.refreshToken = refreshToken
      await user.save({validateBeforeSave:false})
      return {accessToken,refreshToken}
   } catch (error) {
      throw new ApiError(500,"Something went wrong while generating refresh and access token")
   }
}

const registerUser = asyncHandler(async (req, res) => {
   // Get user details from frontend
   const { username, email, password, fullname } = req.body;
   console.log({ "email": email, "password": password, "username": username });

   // Validation - not empty
   if ([fullname, email, username, password].some((field) => field?.trim() === "")) {
      throw new ApiError(400, "All fields are required");
   }

   // Check if user already exists: username or email
   const userExists = await User.findOne({
      $or: [{ username }, { email }]
   });
   if (userExists) {
      throw new ApiError(409, "User with these credentials already exists");
   }

   console.log(req.files);
   // Check for images and avatar 
   const avatarLocalPath = req.files?.avatar?.[0]?.path;
   const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
   if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is required");
   }

   // Upload images to cloudinary
   const avatar = await uploadOnCloudinary(avatarLocalPath);
   const coverImage = await uploadOnCloudinary(coverImageLocalPath);
   if (!avatar) {
      throw new ApiError(400, "Failed to upload avatar file");
   }

   // Create user entry in the database
   const user = await User.create({
      fullname,
      username: username.toLowerCase(),
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password
   });

   // Remove password and refresh token from response
   const createdUser = await User.findById(user._id).select("-password -refreshToken");
   if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering a user");
   }

   // Return response
   return res.status(201).json(
      new ApiResponse(201, createdUser, "User registered successfully")
   );
});

const loginUser = asyncHandler(async (req, res) => {
   // get the data from user
   const {username,email,password} = req.body
   
   if(!username || !email){
      throw new ApiError(400,"Username or email is required")
   }

   // find the user with the get data from user
    const user =  await User.findOne({
      $or:[{username},{email}]
   })
   if(!user){
      throw new ApiError(404,"User does not exists with this credentials")
   }

   // password check
   const passwordValid = await user.isPasswordCorrect(password)
   if(!passwordValid){
      throw new ApiError(401,"Password is incorrect")
   }
   // get access and refresh token
   const {accessToken,refreshToken} = await generateAccessRefreshToken(user._id)
   const LogedUser = await User.findById(user._id).select("-password -refreshToken")

   // send cookies
   const options = {
      httpOnly:true,
      secure:true
   }
   // return response
   return res.status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",refreshToken,options)
   .json(new ApiResponse(200, {user:LogedUser,accessToken,refreshToken},"User logedIn"))
});

const LogOutUser = asyncHandler(async(req,res)=>{
   User.findByIdAndUpdate(
      req.user._id,{
         $set:{
            refreshToken:undefined
         }
      },{
         new:true
      }
   )
   const options = {
      httpOnly:true,
      secure:true
   }
   return res.status(200)
   .clearCookie("accessToken",options)
   .clearCookie("refreshToken",options)
   .json(new ApiResponse(200,{},"User logOut"))
})
export { registerUser, loginUser, LogOutUser};
