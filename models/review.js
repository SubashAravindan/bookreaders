var mongoose=require("mongoose");

var reviewSchema= new mongoose.Schema({
	rating:String,
	content:String,
	bookId:String,
	username:String,
})

module.exports=mongoose.model("review",reviewSchema)