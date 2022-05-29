const jwt = require("jsonwebtoken");



const authToken = (token)=>{
    let tokenValidate = jwt.verify(token,"project5",(err,data)=>{
        if(err) 
        return null
        else{
            return data
        }    
    })
    return tokenValidate
}


const auth = async function (req, res, next) {
    try {
        let token = req.headers["authorization"]
        if (!token) {
           return res.status(401).send({ status: false, message: "token must be present" });
        }
        console.log(token)
     const bearer=token.split(" ")
     console.log(bearer)
     const bearerToken=bearer[1]
     console.log(bearerToken)
       let decodedToken = authToken(bearerToken)
       if(!decodedToken){
           return res.status(401).send({status:false,message:"inavlid token"})
       }
        console.log(decodedToken)
        
            req["userId"]= decodedToken.userId
             
            next()
          
    } 
    catch (erre) {
        return res.status(500).send({  status:"Error", error: erre.message })

    }
}

module.exports={auth}