var      express = require("express"),
             app = express(),
        passport = require("passport"),
         request = require("request"),
      bodyParser = require("body-parser"),
      		User = require("./models/user.js"),
      	Activity = require("./models/activity.js"),
      	  Review = require("./models/review.js"),
   LocalStrategy = require("passport-local"),
     	mongoose = require("mongoose");

app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine","ejs");
mongoose.connect("mongodb://localhost/booksmanager");
app.use(express.static(__dirname+"/public"));
process.on('unhandledRejection', function(reason, promise) {
    console.log(promise);
});

//==============================PASSPORT CONFIG=============================

app.use(require("express-session")({
	secret:"ssshhh this is a very secrety secret",
	resave:false,
	saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
	res.locals.currentUser=req.user;
	next();
})

//===========================================================================

//========ROOT==========
app.get("/",isLoggedIn,	(req,res)=>{
	url="https://www.googleapis.com/books/v1/volumes?q=subject:adventure";
	request(url,(err,response,body)=>{
		if(response.statusCode===200&&!err){
			data=JSON.parse(body);
			res.render("home",{items:data.items});
		}
	})
	
})

//=====SHOW BOOK PAGE============

app.get("/books/:id",isLoggedIn,(req,res)=>{
	User.findById(req.user.id,(err,foundUser)=>{
		if (foundUser.mylibrary.indexOf(req.params.id)==-1) {
			isLibrary=0;
		} else {
			isLibrary=1;
		}
		if (foundUser.favourites.indexOf(req.params.id)==-1) {
			isfavourite=0;
		} else {
			isfavourite=1;
		}
		readStatus=0;
		foundUser.readStatus.forEach(item=>{
			if (item.bookId===req.params.id) {
				readStatus=item.status;
			}
		})

	})
	request("https://www.googleapis.com/books/v1/volumes/"+req.params.id,(err,response,body)=>{
		if (response.statusCode===200&&!err) {
			volume=JSON.parse(body);
			var passData;
			Review.find({bookId:volume.id},(err,result)=>{
				if (err) {
					console.log(err)
				} else {
					console.log(result)
					passData={
						volume:volume,
						isLibrary:isLibrary,
						isfavourite:isfavourite,
						readStatus:readStatus,
						reviews:result
					}
					res.render("show",passData)						
				}
			
			})
			console.log(passData)

		}
	})
})

//=============ADD TO LIBRARY/FAVOURITES=========

app.post("/usercollections/:collection",isLoggedIn,(req,res)=>{
	collection=(req.params.collection);
	console.log(collection);
	switch(collection){
	case "mylibrary":obj={
			mylibrary:String(req.body.id)
		};break;
	case "favourites":obj={
			favourites:String(req.body.id)
		};break;
	}
	User.findByIdAndUpdate(req.user.id,{$push:obj},(err,result)=>{
		if (err) {
			console.log(err)
		} else {
			Activity.create({username:req.user.username,userId:req.user.id,bookId:req.body.id,bookName:req.body.bookName,activityCode:((collection==='mylibrary')?1:2)},(err,result)=>{
				res.sendStatus(200);
			})
		}
	})
})

//=============REMOVE FROM LIBRARY/FAVOURITES=========

app.delete("/usercollections/:collection",isLoggedIn,(req,res)=>{
	collection=(req.params.collection);
	switch(collection){
	case "mylibrary":obj={
			mylibrary:req.body.id
		};break;
	case "favourites":obj={
			favourites:req.body.id
		};break;
	}
	User.findByIdAndUpdate(req.user.id,{$pull:obj},(err,result)=>{
		if (err) {
			console.log(err)
		} else {
			res.sendStatus(200);
		}
	})
})

//==============SAVE READ STATUS=========

app.post("/readstatus",isLoggedIn,(req,res)=>{
	User.findById(req.user.id,(err,result)=>{
		if (err) {
			console.log(err)
		} else {
			flag=0;
			result.readStatus.forEach(item=>{
				if (item.bookId===req.body.id) {
					flag=1;
					item.status=req.body.status;
				}
			})
			if (flag===0) {
				result.readStatus.push({bookId:req.body.id,status:req.body.status})
			}
			result.save();
			Activity.create({username:req.user.username,userId:req.user.id,bookId:req.body.id,bookName:req.body.bookName,activityCode:Number(req.body.status)+3},(err,result)=>{
				if (err) {
					console.log(err)
				} else {}
			})
		}
	})
})

//=======NEW REVIEW==============

app.get("/reviews/:id/new",isLoggedIn,(req,res)=>{

	request("https://www.googleapis.com/books/v1/volumes/"+req.params.id,(err,response,body)=>{
		if (response.statusCode===200&&!err) {
			res.render("newReview",{id:req.params.id,bookName:JSON.parse(body).volumeInfo.title});
		}
	})
	
})

////======CREATE REVIEW===============

app.post("/reviews/:id",isLoggedIn,(req,res)=>{
	Review.create({rating:req.body.rating,content:req.body.content,username:req.user.username,bookId:req.params.id},(err,result)=>{
		if (err) {
			console.log(err)
		} else {

			Activity.create({username:req.user.username,userId:req.user.id,bookId:req.params.id,bookName:req.body.bookName,activityCode:3},(err,newActivity)=>{
				if (err) {
					console.log(err)
				} else {
					res.redirect("/books/"+result.bookId);
				}
			})
			
		}
	})
})

//=============VIEW PROFILE==================

app.get("/myprofile",isLoggedIn,(req,res)=>{
	res.redirect("/users/"+req.user.id);
})


app.get("/users/:id",isLoggedIn,(req,res)=>{
	User.findById(req.params.id,function(err,result){
		if (err) {
			console.log(err)
		} else {
			if (result) {
					Activity.find({username:result.username},(err,foundAct)=>{
						if (err) {
							console.log(err)
						} else {
							console.log(result)
							res.render("profile",{user:JSON.stringify(result),activity:foundAct})
						}
					})



			} else {
				res.send("NO SUCH USER")
			}
		}
	})
})


app.post("/searchuser",(req,res)=>{
	console.log(req.body)
	console.log(req.body.input)
	User.find({username:req.body.input},(err,result)=>{
		if(result.length){
			console.log(result)
			res.redirect("/users/"+result[0]._id)
		}
		else{
			res.send("NO SUCH USER")
		}
		
	})
	
})

app.get("/privacy/:value",(req,res)=>{
	User.findByIdAndUpdate(req.user.id,{activityPrivacy:req.params.value},(err,result)=>{
		if (err) {
			console.log(err);
		}
		res.sendStatus(200);
	})
})

//===========================AUTH ROUTES====================================

app.get("/register",(req,res)=>{	
	res.render("register");
})

app.get("/usernamecheck",(req,res)=>{
	User.find({username:req.query.input},(err,result)=>{
		if (err) {
			console.log(err)
		} else {
			res.send(""+result.length);
		}
	})
})

app.post("/register",(req,res)=>{
	User.register(new User({username:req.body.username}),req.body.password,(err,user)=>{
		if (err) {
			console.log(err)
			return res.redirect('/register');
		} else {
			passport.authenticate("local")(req,res,()=>{
				res.redirect('/');
			})
		}
	})
})

app.get("/login",(req,res)=>{
	res.render("login");
})

app.post("/login",passport.authenticate("local",
	{
		successRedirect:"/",
		failureRedirect:"/login"
	}),(req,res)=>{}
);

app.get("/logout",(req,res)=>{
	req.logout();
	res.redirect("/");
})

function isLoggedIn(req,res,next){
	if (req.user) {
		return next();
	} else {
		res.redirect('/login');
	}
}



app.listen(3000,()=>{
	console.log("Server Started")
})