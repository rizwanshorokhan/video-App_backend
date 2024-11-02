import { v2 as cloudinary } from "cloudinary";
import fs from 'fs'

cloudinary.config({ 
   cloud_name:process.env.CLUDINARY_CLOUD_NAME, 
   api_key:process.env.CLUDINARY_API_KEY, 
   api_secret: process.env.CLUDINARY_API_SECRET
});


export const uploadOnCloudinary = async (localFilePath)=>{
   try {
      if(!localFilePath) return null
      // upload the file on cloudinary
      const response = await cloudinary.uploader.upload(localFilePath, {
         resource_type: "auto"
      })
      // file has been uploaded successfully
      console.log("file is uploaded on cloudinary", response.url);
      fs.unlinkSync(localFilePath)
      return response
   } catch (error) {
      fs.unlinkSync(localFilePath) // remove the file from localfilepath as the upload operation got failed
      return null
   }
}