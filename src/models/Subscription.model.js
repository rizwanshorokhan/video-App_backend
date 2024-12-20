import mongoose, { Schema } from "mongoose";

const SubscriptionSchema = new Schema(
   {
      subscriber:{
         type:Schema.Types.ObjectId, // one who is subscribing
         ref:'User'
      },
      channel:{
         type:Schema.Types.ObjectId, // one to whom 'subscriber' to subscribed
         ref:'User'
      },
      
   },{
      timestamps:true
   }
)
export const Subsciption = mongoose.model("Subscription",SubscriptionSchema)