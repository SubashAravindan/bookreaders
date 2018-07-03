 var mongoose=require("mongoose"),
 passportLocalMongoose=require("passport-local-mongoose");

 var userSchema= new mongoose.Schema({
 	username:String,
 	password:String,
 	favourites:[String],
 	mylibrary:[String],
 	readStatus:[
 		{
 			bookId:String,
 			status:String     //1 for finished 2 for reading 3 for wanna read
 		}
 	],
 	activityPrivacy:String
 })

 userSchema.plugin(passportLocalMongoose);

 module.exports=mongoose.model("user",userSchema);