import mongoose from "mongoose";
import  jwt  from "jsonwebtoken";
import bcrypt from 'bcrypt'

const UserSchema = new mongoose.Schema(
   {
      username:{
         type:String,
         required:true,
         lowercase:true,
         trim:true,
         index:true,
      },
      email:{
         type:String,
         required:true,
         lowercase:true,
         trim:true,
         unique:true,
      },
      fullname:{
         type:String,
         required:true,
         index:true,
      },
      avatar:{
         type:String, // cloudinary url
         required:true,
      },
      coverImage:{
         type:String, // cloudinary url
      },
      watchHistory:[
         {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Video"
         }
      ],
      password:{
         type:String,
         required:[true, 'Password must be have 8 characters']
      },
      refreshToken:{
         type:String
      }
   },{
      timestamps:true
   }
)

UserSchema.pre("save", async function (next) {
   if(!this.isModified("password")){
      return next()
   }
   this.password = await bcrypt.hash(this.password, 8)
   next()
})
UserSchema.methods.isPasswordCorrect = async function (password) {
   return await bcrypt.compare(password, this.password)
}
UserSchema.methods.generateAccessToken = function(){
   return jwt.sign(
      {
         _id:this._id,
         email:this.email,
         username:this.username,
         password:this.password
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
         expiresIn: process.env.ACCESS_TOKEN_EXPIRY
      }
   )
}
UserSchema.methods.generateRefreshToken = function(){
   return jwt.sign(
      {
         _id:this._id
      },
      process.env.REFRESH_TOKEN_SERCRET,
      {
         expiresIn: process.env.REFRESH_TOKEN_EXPIRY
      }
   )
}

export const User = mongoose.model('User',UserSchema)