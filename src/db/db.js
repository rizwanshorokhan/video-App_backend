import mongoose from "mongoose";
import { DB_NAME } from '../constant.js'


const connectDB = async()=>{
   try{
      const connection = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
      console.log(`/n MongoDb connected !! DB host: ${connection.connection.host}`)
   }catch(error){
      console.log("MONGODB CONNECTION ERROR: ", error)
      process.exit(1)
   }
}

export default connectDB