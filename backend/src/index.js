// require('dotenv').config({path:'./env'})
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});


connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running on the PORT ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log(`MongoDB Connection Faild`, error);
  });

// const app=express()
// (async ()=>{
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_Name}`)
//         app.listen(process.env.PORT,()=>{
//             console.log(`App is Listening)
//             {process.env.PORT}`);
//         })
//     }catch(error){
//          console.error("Error" ,error)
//     }
// })()
