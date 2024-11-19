import dotenv from 'dotenv';
import connectDB from './db/db.js';
import {app} from './app.js'
dotenv.config({
   path:'./.env'
}); // No need for 'path' if .env is in the root directory



// Connect to MongoDB and start the server
(async () => {
   try {
      app.get('/', (req, res) => {
         res.send("APP IS RUNNING");
      });
      await connectDB();
      app.listen(process.env.PORT, () => {
         console.log(`App is listening on http://localhost:${process.env.PORT}`);
      });
   } catch (err) {
      console.log("MONGO DB CONNECTION FAILED !!!", err);
   }
})();
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