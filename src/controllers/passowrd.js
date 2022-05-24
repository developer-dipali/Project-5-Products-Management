const bcrypt=require("bcryptjs")

const securePassword=async(password)=>{
    const passwordhash=await bcrypt.hash(password,10)
    console.log(passwordhash)
    
}  
const createPassword=function(req,res){
    securePassword(req.body.password)

}


module.exports={createPassword}