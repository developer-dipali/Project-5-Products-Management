const userModel =require("../models/userModel")
const ObjectId=require("mongoose").Types.ObjectId
const aws = require("aws-sdk")
const bcrypt=require("bcryptjs")
const jwt=require("jsonwebtoken")
const { AutoScaling } = require("aws-sdk")
const {uploadFile}=require("./aws")



const isValidRequestBody = function (value) {
    return Object.keys(value).length > 0
  }
   
  
  //validaton check for the type of Value --
  const isValid = (value) => {
    if (typeof value == 'undefined' || value == null) return false;
    if (typeof value == 'string' && value.trim().length == 0) return false;
    if (typeof value === 'number'&&value.toString().trim().length===0) return false;
    return true
  }
  
  

const createUser =async (req,res)=>{

    try {

        let data = req.body
        data=JSON.parse(JSON.stringify(data))  
        if (!isValidRequestBody(data)) {
            res.status(400).send({ status: false, message: "invalid request parameters.plzz provide user details" })
            return
        }
        let file= req.files
        console.log(file)
        if(file && file.length>0){
           
            let uploadedFileURL= await uploadFile( file[0] )
           
            data["profileImage"]=uploadedFileURL
        }
        else{
            return res.status(400).send({ msg: "No file found" })
        }

        

        //Validate attributes --
        let { fname, lname, email, password, phone, address } = data

        if (!isValid(fname)) {
            res.status(400).send({ status: false, message: " first name is required" })
            return
        }
        if (!/^[A-Za-z\s]{1,}[\.]{0,1}[A-Za-z\s]{0,}$/.test(fname)) {
            return res.status(400).send({ status: false, message: "Please enter valid user first name." })
        }
       

        // name validation
        if (!isValid(lname)) {
            res.status(400).send({ status: false, message: "last name is required" })
            return
        }

        //this will validate the type of name including alphabets and its property withe the help of regex.
        if (!/^[A-Za-z\s]{1,}[\.]{0,1}[A-Za-z\s]{0,}$/.test(lname)) {
            return res.status(400).send({ status: false, message: "Please enter valid user last name." })
        }

        //Email Validation --
        if (!isValid(email)) {
            return res.status(400).send({ status: false, message: "plzz enter email" })
        }
        email = email.toLowerCase().trim()
        const emailPattern = /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})/       //email regex validation for validate the type of email.

        if (!email.match(emailPattern)) {
            return res.status(400).send({ status: false, message: "This is not a valid email" })
        }

        
        const emailExt = await userModel.findOne({ email: email })
        if (emailExt) {
            return res.status(400).send({ status: false, message: "Email already exists" })
        }

        //Password Validations--
        if (!isValid(password)) {
            return res.status(400).send({ status: false, message: "plzz enter password" })
        }
        password=password.trim()
        if (password.length < 8 || password.length > 15) {
            return res.status(400).send({ status: false, message: "plzz enter valid password" })
        }


        const salt=await bcrypt.genSalt(10)
        data.password=await bcrypt.hash(password,salt)
        console.log(data.password)



        //Phone Validations--
        if (!isValid(phone)) {
            return res.status(400).send({ status: false, message: "plzz enter mobile" })
        }

        //this regex will to set the phone no. length to 10 numeric digits only.
        if (!/^(\+91)?0?[6-9]\d{9}$/.test(phone.trim())) {
            return res.status(400).send({ status: false, message: "Please enter valid 10 digit mobile number." })
        }

        const phoneExt = await userModel.findOne({ phone: phone })
        if (phoneExt) {
            return res.status(400).send({ status: false, message: "phone number already exists" })
        }

        //for address--

        // this validation will check the address is in the object format or not--
        if(!address){
            return res.status(400).send({ status: false, message: "address is required" })
        }
        data.address=JSON.parse(data.address)
        
         //address=JSON.parse(address)
         //console.log(address)
         //console.log(typeof address)

        if (typeof data.address != "object") {
                return res.status(400).send({ status: false, message: "address should be an object" })
            }
        let { shipping,billing} = data.address
        
        console.log(typeof shipping)
        console.log(shipping)
        //console.log(shipping.city)

        if(!shipping){
               
                return res.status(400).send({ status: false, message: "shipping is required" })
        }
        console.log(1)
    
        if (typeof shipping != "object") {
                    return res.status(400).send({ status: false, message: "shipping should be an object" })
                }
        if(!billing){
                return res.status(400).send({ status: false, message: "billing is required" })
            }
    
                if (typeof billing != "object") {
                    return res.status(400).send({ status: false, message: "billing should be an object" })
                }
            
                if (!isValid(shipping.street)) {
                    return res.status(400).send({ status: false, message: "shipping street is required" })
                }


                if (!isValid(shipping.city)) {
                    return res.status(400).send({ status: false, message: "shipping city is required" })
                }
                if (!/^[a-zA-Z]+$/.test(shipping.city)) {
                    return res.status(400).send({ status: false, message: "city field have to fill by alpha characters" });
                }
    

                if (!isValid(shipping.pincode)) {
                    return res.status(400).send({ status: false, message: "shipping pincode is required" })
                }

                 //applicable only for numeric values and extend to be 6 characters only--
                if (!/^\d{6}$/.test(shipping.pincode)) {
                    return res.status(400).send({ status: false, message: "plz enter valid pincode" });
                }

                if (!isValid(billing.street)) {
                    return res.status(400).send({ status: false, message: "billing street is required" })
                }


                if (!isValid(billing.city)) {
                    return res.status(400).send({ status: false, message: "billing city is required" })
                }
                if (!/^[a-zA-Z]+$/.test(billing.city)) {
                    return res.status(400).send({ status: false, message: "city field have to fill by alpha characters" });
                }
    

                if (!isValid(billing.pincode)) {
                    return res.status(400).send({ status: false, message: "billing pincode is required" })
                }

                 //applicable only for numeric values and extend to be 6 characters only--
                if (!/^\d{6}$/.test(billing.pincode)) {
                    return res.status(400).send({ status: false, message: "plz enter valid  billing pincode" });
                }
               
           //DOUBT
           
        console.log(data)       

        let saveData = await userModel.create(data)
        return res.status(201).send({ status: true, message: "success", data: saveData })
        
    }
     catch (error) {

        return res.status(500).send({ status: "error", message: error.message })
        
    }



}




const loginUser = async function (req, res) {
    try {
      const requestBody = req.body;
      if (!isValidRequestBody(requestBody)) {
        return res
          .status(400)
          .send({ status: false, msg: "please provide data to signIn" });
      }
      let { email, password } = requestBody;
  
      if (!isValid(email)) {
        return res
          .status(400)
          .send({ status: false, msg: "please provide email" });
      }
      email = email.toLowerCase().trim()
        const emailPattern = /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})/       //email regex validation for validate the type of email.

        if (!email.match(emailPattern)) {
            return res.status(400).send({ status: false, message: "This is not a valid email" })
       }
      if (!isValid(password)) {
        return res
          .status(400)
          .send({ status: false, msg: "please provide password" });
      }
      if (password.length < 8 || password.length > 15) {
        return res.status(400).send({ status: false, message: "plzz enter valid password" })
    }
      const emailCheck=await userModel.findOne({email:email})
      if(!emailCheck){
          return res.status(404).send({status:false,message:"Email not found"})
      }
      const dbPassword=emailCheck.password
      console.log(dbPassword)
      
      //const salt=await bcrypt.genSalt(10)
    //   let hashPassword=await bcrypt.hash(password,salt)
    //   console.log(hashPassword)
       const passwordMathched=await bcrypt.compare(password,dbPassword)
       console.log(passwordMathched)
       if(!passwordMathched){
           return res.status(400).send({status:false,message:"Please provide valid credentils"})
       }

  
    
      
    
  
      const userId = emailCheck._id;
  
      const data = { email, password };
      if (data) {
        const token =jwt.sign(
          {
            userId: userId
          
          },
          "project5",{expiresIn:"24hr"}
        );
        res
          .status(200)
          .send({ status: true, msg: "user login sucessfully",data:{userId:userId, token: token} });
      }
    }catch (err) {
      res.status(500).send({ status: false, data: err.message });
    }
  };



  const getUser=async function(req,res){
      try{
         let pathParams=req.params.userId 
        if(!ObjectId.isValid(pathParams)){
            return res.status(400).send({status:false,message:"Please enter valid userId"})
        }
        let authorToken=req.userId
        if(!ObjectId.isValid(authorToken)){
            return res.status(400).send({status:false,message:"Please enter valid user token"})
        }
        let user=await userModel.findOne({_id:pathParams}) 
        if(!user){
            return res.status(404).send({status:false,message:"No user found"})
        }
        if(authorToken!==pathParams){
            return res.status(403).send({status:false,message:"Unauthorized user"})
        }
        let data=await userModel.findOne({_id:pathParams})
        return res.status(200).send({status:true,message: "User profile details",data:data})
        

      }
      catch(err){
          return res.status(500).send({status:false,message:err.message})
      }
  }




  const updateUser=async function(req,res){
      try{
          let pathParams=req.params.userId 
        
          if(!ObjectId.isValid(pathParams)){
              return res.status(400).send({status:false,message:"user id is not valid"})
          }
          let authorToken=req.userId
          if(!ObjectId.isValid(authorToken)){
              return res.status(400).send({status:false,message:"Please enter valid user token"})
          }
        let user=await userModel.findOne({_id:pathParams}) 
        if(!user){
            return res.status(404).send({status:false,message:"No user found"})
        }

         
        if(authorToken!==pathParams){
            return res.status(403).send({status:false,message:"Unauthorized user"})
        }
          

          let data=JSON.parse(JSON.stringify(req.body))
          if(!isValidRequestBody(data)){
              return res.status(400).send({status:false,message:"Nothing to update"})
          } 
          let {email,phone,lname,fname,password,address}=data 
          console.log(address)
          if(email){
            if (!isValid(email)) {
                return res.status(400).send({ status: false, message: "plzz enter email" })
            }
            email = email.toLowerCase().trim()
            const emailPattern = /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})/       //email regex validation for validate the type of email.
    
            if (!email.match(emailPattern)) {
                return res.status(400).send({ status: false, message: "This is not a valid email" })
            }
    
            
            const emailExt = await userModel.findOne({ email: email })
            if (emailExt) {
                return res.status(400).send({ status: false, message: "Email already exists" })
            }
          
            data.email=email
        
    }

          if(phone){
            if (!isValid(phone)) {
                return res.status(400).send({ status: false, message: "plzz enter mobile" })
            }
            
    
            //this regex will to set the phone no. length to 10 numeric digits only.
            if (!/^(\+91)?0?[6-9]\d{9}$/.test(phone.trim())) {
                return res.status(400).send({ status: false, message: "Please enter valid 10 digit mobile number." })
            }
    
            const phoneExt = await userModel.findOne({ phone: phone })
            if (phoneExt) {
                return res.status(400).send({ status: false, message: "phone number already exists" })
            }
          
            

        
            
            data.phone=phone
        
    }

          
        console.log(address) 
        let file= req.files
        console.log(file)
        if(file && file.length>0){
           
            let uploadedFileURL= await uploadFile( file[0] )
           
            data["profileImage"]=uploadedFileURL
        }
        
        if(fname){
            if(!isValid(fname)){
                return res.status(400).send({status:false,message:"Please enter valid fname"})
            }
            data.fname=fname 
        }
        if(lname){
        if(!isValid(lname)){
            return res.status(400).send({status:false,message:"Please enter valid lname"})
            
        }
        data.lname=lname
       }
        if(password){
            if (!isValid(password)) {
                return res.status(400).send({ status: false, message: "plzz enter password" })
            }
            password=password.trim()
            if (password.length < 8 || password.length > 15) {
                return res.status(400).send({ status: false, message: "plzz enter valid password" })
            }
    
    
            const salt=await bcrypt.genSalt(10)
            data.password=await bcrypt.hash(password,salt)
            //console.log(data.password)
    
    
        
    
    
            
        }
       
        
        if(address){
            console.log(1)
            data.address=JSON.parse(data.address)
            console.log(typeof data.address)
            if(typeof data.address !="object"){
                return res.status(400).send({status:false,message:"Address must be in object"})

            }
            
                let {shipping,billing}=data.address 
                
                // console.log(3)
                // console.log(shipping)
                // console.log(typeof shipping)
                if(shipping){

                    
                    if(typeof shipping !="object"){
                        return res.status(400).send({status:false,message:"Shipping must be in object"})
                    } 
                    if(Object.keys(shipping).length==0){
                        return res.status(400).send({status:false,message:"No keys are given in shipping"})

                    }
                    let {street,city,pincode}=shipping
                    if(street){
                    if(!isValid(street)){
                        return res.status(400).send({ status: false, message: "shipping street is required" })
                    }
                        
                        data.address.shipping.street=shipping.street
                    
                   }
                   if(city){
                    if (!isValid(shipping.city)) {
                        return res.status(400).send({ status: false, message: "shipping city is required" })
                    }
                    if (!/^[a-zA-Z]+$/.test(shipping.city)) {
                        return res.status(400).send({ status: false, message: "city field have to fill by alpha characters" });
                    }
                    
                        data.address.shipping.city=shipping.city
                    
                }   if(pincode){
                    if (!isValid(pincode)) {
                        return res.status(400).send({ status: false, message: "Shipping pincode is required" })
                    }
    
                     //applicable only for numeric values and extend to be 6 characters only--
                    if (!/^\d{6}$/.test(pincode)) {
                        return res.status(400).send({ status: false, message: "plz enter valid  shipping pincode" });
                    }
                    
                        data.address.shipping.pincode=shipping.pincode
                    

                


                }
            }
                
            if(billing){

                    
                if(typeof billing !="object"){
                    return res.status(400).send({status:false,message:"billing must be in object"})
                }
                if(Object.keys(billing).length==0){
                    return res.status(400).send({status:false,message:"No keys are given in billing"})

                } 
                let {street,city,pincode}=billing
                if(street){
                if(!isValid(street)){
                    return res.status(400).send({ status: false, message: "billing street is required" })
                }
                    
                    data.address.billing.street=billing.street
                
               }
               if(city){
                if (!isValid(billing.city)) {
                    return res.status(400).send({ status: false, message: "billing city is required" })
                }
                if (!/^[a-zA-Z]+$/.test(billing.city)) {
                    return res.status(400).send({ status: false, message: "city field have to fill by alpha characters" });
                }
                
                    data.address.billing.city=billing.city
                
            }   if(pincode){
                if (!isValid(pincode)) {
                    return res.status(400).send({ status: false, message: "billing pincode is required" })
                }

                 //applicable only for numeric values and extend to be 6 characters only--
                if (!/^\d{6}$/.test(billing.pincode)) {
                    return res.status(400).send({ status: false, message: "plz enter valid  billing pincode" });
                }
                
                    data.address.billing.pincode=billing.pincode
                

            


            }
        }
            
            

            
        }
        data.address={
            shipping:{
                street:data.address?.shipping?.street || user.address.shipping.street ,
                city:data.address?.shipping?.city || user.address.shipping.city,
                pincode:data.address?.shipping?.pincode || user.address.shipping.pincode 
            },
            billing:{
                street:data.address?.billing?.street || user.address.billing.street ,
                city:data.address?.billing?.city || user.address.billing.city,
                pincode:data.address?.billing?.pincode || user.address.billing.pincode

            }

        }

        
        
        
        let updatedData=await userModel.findByIdAndUpdate({_id:pathParams},data,{new:true})
        return res.status(200).send({status:true,data:updatedData})
        

   
                
        



          


      }
      catch(err){
          return res.status(500).send({status:false,message:err.message})
      }
  }

module.exports={createUser,loginUser,getUser,updateUser}