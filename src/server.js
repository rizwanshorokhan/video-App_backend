import express from 'express';
import dotenv from 'dotenv'
import connectDB from './db/db.js';

dotenv.config({
   path:'./env'
})

connectDB()

const app = express();

/*
( async ()=>{
   try {
    await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
    app.on("error",(error)=>{
      console.log("ERROR: ",error)
      throw error
    })
    app.listen(process.env.PORT, ()=>{
      console.log(`App is listening on http://localhost:${process.env.PORT}`)
    })
   } catch (error) {
      console.log("ERROR: ",error)
   }
})
()

*/
app.listen(process.env.PORT, ()=>{
   console.log(`App is listening on http://localhost:${process.env.PORT}`)
 })