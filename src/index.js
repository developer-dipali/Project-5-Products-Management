const express= require("express")
const bodyParser= require("body-parser")
const route= require("../src/route/routes")
const mongoose= require("mongoose")
const app= express();
const multer = require("multer")

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use( multer().any())

mongoose.connect("mongodb+srv://Shreya1998:1234.qwer@cluster0.gzlyp.mongodb.net/project5Group22?retryWrites=true&w=majority", {
    useNewUrlParser: true
})
.then( () => console.log("MongoDb is connected"))
.catch ( err => console.log(err) )

app.use('/', route);

app.all("*",(req,res)=>{
    throw new Error("Bad request")
})
app.use((e,req,res,next)=>{
    if(e.message === "Bad request"){
        res.status(400).send({status:false,error:e.message})
    }
})

app.listen(process.env.PORT || 4000, function () {
    console.log('Express app running on port ' + (process.env.PORT || 4000))
});