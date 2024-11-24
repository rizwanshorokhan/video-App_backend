import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/User.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.mjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
// generate access and refresh toke
const generateAccessRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // Get user details from frontend
  const { username, email, password, fullname } = req.body;
  console.log({ email: email, password: password, username: username });

  // Validation - not empty
  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Check if user already exists: username or email
  const userExists = await User.findOne({
    $or: [{ username }, { email }],
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
    password,
  });

  // Remove password and refresh token from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering a user");
  }

  // Return response
  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // get the data from user
  const { username, email, password } = req.body;

  if (!username || !email) {
    throw new ApiError(400, "Username or email is required");
  }

  // find the user with the get data from user
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new ApiError(404, "User does not exists with this credentials");
  }

  // password check
  const passwordValid = await user.isPasswordCorrect(password);
  if (!passwordValid) {
    throw new ApiError(401, "Password is incorrect");
  }
  // get access and refresh token
  const { accessToken, refreshToken } = await generateAccessRefreshToken(
    user._id
  );
  const LogedUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // send cookies
  const options = {
    httpOnly: true,
    secure: true,
  };
  // return response
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: LogedUser, accessToken, refreshToken },
        "User logedIn"
      )
    );
});

const LogOutUser = asyncHandler(async (req, res) => {
  User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logOut"));
});

const refreshAccessToken = async (req, res) => {
  try {
    const inComingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;
    if (!inComingRefreshToken) {
      throw new ApiError(401, "Unauthorized request");
    }
    const decodedToken = jwt.verify(
      inComingRefreshToken,
      process.env.ACCESS_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refreshToken");
    }

    if (inComingRefreshToken !== User?.refreshToken) {
      throw new ApiError(401, "Invalid refreshToken");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newrefreshToken } = await generateAccessRefreshToken(
      user._id
    );
    return res
      .status(200)
      .cookie("accessToken", accessToken)
      .cookie("refreshToken", newrefreshToken)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newrefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message, "Invalid refresh token");
  }
};

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  const isPasswordCoorect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCoorect) {
    throw new ApiError(400, "Invalid old Password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: true });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"));
});
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;
  if (!fullname || !email) {
    throw new ApiError(400, "All fields are required");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { fullname, email },
    },
    {
      new: true,
    }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Accounts Details updated successfully"));
});
const useravatarUpdate = asyncHandler(async (req, res) => {
  const avatarlocalPath = await req.file?.path;
  if (!avatarlocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }
  const avatar = await uploadOnCloudinary(avatarlocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading");
  }
  const updatedAvatar = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).json(
    new ApiResponse(200, updatedAvatar, "cover image updated successfully")
  );
});
const userCoverimageUpdate = asyncHandler(async (req, res) => {
  const coverImagelocalPath = await req.file?.path;
  if (!coverImagelocalPath) {
    throw new ApiError(400, "Avatar cover image is missing");
  }
  const coverImage = await uploadOnCloudinary(coverImagelocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading");
  }

  const updatedCoverImage = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedCoverImage,
        "cover image updated successfully"
      )
    );
});

const getUserCannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) {
    throw new ApiError(400, "username is missing");
  }
  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscribers",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelSubscribedToCount: {
          $size: "subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        subscribersCount: 1,
        channelSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);
  if (!channel?.length) {
    throw new ApiError(404, "channel dose not exists");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel matched successfully")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch history fetched successfully"
      )
    );
});
export {
  registerUser,
  loginUser,
  LogOutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  useravatarUpdate,
  userCoverimageUpdate,
  getUserCannelProfile,
  getWatchHistory,
};
