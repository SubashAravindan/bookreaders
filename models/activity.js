var mongoose=require("mongoose");

var activitySchema=new mongoose.Schema({
	username:String,
	userId:String,
	bookName:String,
	bookId:String,
	activityCode:Number,

})

activitySchema.methods.giveString=function(){
	switch(this.activityCode){
		case 1: actionString =" added to their library :";break; 
		case 2: actionString =" added to their favourites";break; 
		case 3: actionString =" wrote a review for :";break; 
		case 4: actionString =" completed reading :";break; 
		case 5: actionString =" is currently reading ";break; 
		case 6: actionString =" wants to read ";break; 
	} 
	return actionString;
}
// 1 for add to library
// 2 for add to favourite
// 3 for review
// 4 for completed reading
// 5 for started reading
// 6 for wanna read

module.exports=mongoose.model("activity",activitySchema)