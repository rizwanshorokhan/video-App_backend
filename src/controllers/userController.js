import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/User.model.js";
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.mjs';

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
   res.status(200).json({ message: "Logged in" });
});

export { registerUser, loginUser };
