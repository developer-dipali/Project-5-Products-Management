const productModel =require("../models/productModel")
const ObjectId=require("mongoose").Types.ObjectId
const aws = require("aws-sdk")
const bcrypt=require("bcryptjs")
const jwt=require("jsonwebtoken")
const { AutoScaling } = require("aws-sdk")
const {uploadFile}=require("./aws")

const validString = function(value) {
    if (typeof value === 'string' && value.trim().length === 0) return false //it checks whether the string contain only space or not 
    return true;
}

//for product
const validInstallment = function isInteger(value) {
if (value < 0) return false
if (value % 1 == 0) return true;
}


  
  
  
  

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




const createProduct = async function(req, res) {
    try {
        let file = req.files;
        let requestBody = req.body;
        console.log(requestBody)
        let productImage;

        //validating empty req body.
        if (!isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: "Please provide valid request body" })
        }

        //extract params for request body.
        let {
            title,
            description,
            price,
            currencyId,
            currencyFormat,
            isFreeShipping,
            style,
            availableSizes,
            installments
        } = requestBody

        //validation for the params starts.
        if (!isValid(title)) {
            return res.status(400).send({ status: false, message: "Title is required" })
        }

        //searching title in DB to maintain their uniqueness.
        const istitleAleadyUsed = await productModel.findOne({ title })
        if (istitleAleadyUsed) {
            return res.status(400).send({
                status: false,
                message: `${title} is alraedy in use. Please use another title.`
            })
        }

        //uploading product image to AWS.
        if(file && file.length>0){
           
            let uploadedFileURL= await uploadFile( file[0] )
            
            requestBody["productImage"]=uploadedFileURL
            }
            else{
                return res.status(400).send({status:false, message: "No file found" })
            }

        if (!isValid(description)) {
            return res.status(400).send({ status: false, message: "Description is required" })
        }

        if (!isValid(price)) {

            return res.status(400).send({ status: false, message: "Price is required" })
        }
        if(isNaN(price)){
            return res.status(400).send({status:false,message:"Price can only be number"})
        }
        if(price<0){
            return res.status(400).send({status:false,message:"Only positive nos are allowed in price"})
        }
        console.log(currencyId)

        if (!isValid(currencyId)) {
            return res.status(400).send({ status: false, message: "currencyId is required" })
        }

        if (currencyId != "INR") {
            return res.status(400).send({ status: false, message: "currencyId should be INR" })
        }

        if (!isValid(currencyFormat)) {
            return res.status(400).send({ status: false, message: "currencyFormat is required" })
            
        }
        if (currencyFormat != "₹") {
            return res.status(400).send({ status: false, message: "currencyFormat should be ₹" })
        }
         

        if (style) {
            if (!validString(style)) {
                return res.status(400).send({ status: false, message: "style is required" })
            }
        }

        if (installments) {
            if (!isValid(installments)) {
                return res.status(400).send({ status: false, message: "installments required" })
            }
        }
        if (installments) {
            if (!validInstallment(installments)) {
                return res.status(400).send({ status: false, message: "installments must be number " })
            }
        }

        if (isFreeShipping) {
            if (!(isFreeShipping != true)) {
                return res.status(400).send({ status: false, message: "isFreeShipping must be a boolean value" })
            }
        }

        productImage=requestBody["productImage"]

        //object destructuring for response body.
        const newProductData = {
            title,
            description,
            price,
            currencyId,
            currencyFormat: currencyFormat,
            isFreeShipping,
            style,
            availableSizes,
            installments,
            productImage: productImage
        }

        //validating sizes to take multiple sizes at a single attempt.
        if (availableSizes) {
            let sizesArray = availableSizes.split(",").map(x => x.trim())
            console.log(sizesArray)
            console.log(typeof sizesArray)
            

            for (let i = 0; i < sizesArray.length; i++) {
                if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(sizesArray[i]))) {
                    console.log(sizesArray[i])
                    return res.status(400).send({ status: false, message: "AvailableSizes should be among ['S','XS','M','X','L','XXL','XL']" })
                }
            }

            //using array.isArray function to check the value is array or not.
            if (Array.isArray(sizesArray)) {
                newProductData['availableSizes'] = [...sizesArray]
            }
    
        }
        const saveProductDetails = await productModel.create(newProductData)
        return res.status(201).send({ status: true, message: "Product added successfully.", data: saveProductDetails })

    } catch (err) {
        return res.status(500).send({
            status: false,
            message: "Error is : " + err
        })
    }
}

const getProducts=async function(req,res){
    try{
    const getQuery = req.query;
    let query = { isDeleted: false};
    if (isValidRequestBody(getQuery)) {
      const { size, name, priceGreaterThan,priceLessThan } = getQuery;


  
      if(isValid(priceGreaterThan)){
          query.price={$gt:priceGreaterThan}
      }
      if(isValid(priceLessThan)){
        query.price={$lt:priceLessThan}
    }
    if(priceGreaterThan&&priceLessThan){
        query.price={$gt:priceGreaterThan,$lt:priceLessThan}
    }
  


      if(isValid(name)){
      query.title={$regex:name,$options:"i"}
      }

      if (isValid(size)) {
        const sizeArr = size
          .trim()
          .split(",")
          .map((x) => x.trim());
        query.availableSizes = { $all: sizeArr }; //selects the documents where the value of a field is an array that contains all the specified elements
      }
    }
const getProduct = await productModel.find(query).sort({price:1})
    if (getProduct.length === 0) {
      return res.status(404).send({ status: false, message: "No products found" });
    }
    return res.status(200).send({status:true,data:getProduct})

    }
    catch(err){
        return res.status(500).send({status:false,message:err.message})
    }
}


const getProductById=async function(req,res){
    try{
        let pathParams=req.params.productId 
        if(!ObjectId.isValid(pathParams)){
            return res.status(400).send({status:false,message:"Please enter valid productId"})
        }
        
        let product=await productModel.findOne({_id:pathParams,isDeleted:false}) 
        if(!product){
            return res.status(404).send({status:false,message:"No product found"})
        }
        
        
        return res.status(200).send({status:true,message: "Product details",data:product})
        


    }
    catch(err){
        return res.status(500).send({status:false,message:err.message})
    }
}

const updateProduct = async function(req,res){
    try {
        let pathParams=req.params.productId
        let data = JSON.parse(JSON.stringify(req.body))
        let file = req.files

        if(!ObjectId.isValid(pathParams)){
            return res.status(400).send({status:false,message:"product id is not valid"})
        }

        let product=await productModel.findOne({_id:pathParams,isDeleted:false}) 
        if(!product){
            return res.status(404).send({status:false,message:"No product found"})
        }

        if(!isValidRequestBody(data)){
            return res.status(400).send({status:false,message:"plz enter valid data for updation"})

        }
        let {  title,description,price,isFreeShipping,style,availableSizes,installments} = data
        if(title){
            if (!isValid(title)) {
                return res.status(400).send({ status: false, message: "Title is required" })
            }
    
           
            let titleAleadyUsed = await productModel.findOne({ title })
            if (titleAleadyUsed) {
                return res.status(400).send({status: false,message: `${title} is alraedy in use. Please use another title.`})
            }

        }
        if(description){
            if (!isValid(description)) {
                return res.status(400).send({ status: false, message: "Description is required" })
            }

        }
        if(price){
            if(isNaN(price)||price<0){
                return res.status(400).send({status:false,message:"Price can only be positive number"})
            }
        }

        if (installments) {
            if (!isValid(installments)) {
                return res.status(400).send({ status: false, message: "installments required" })
            }
        }
        if (installments) {
            if (!validInstallment(installments)) {
                return res.status(400).send({ status: false, message: "installments must be number " })
            }
        }
        if (style) {
            if (!validString(style)) {
                return res.status(400).send({ status: false, message: "style is required" })
            }
        }
        if (isFreeShipping) {
            
            console.log(data)
            if (!["true","false"].includes(isFreeShipping)) {
                return res.status(400).send({ status: false, message: "isFreeShipping must be a boolean value" })
            }
        }
        if(file && file.length>0){           
            let uploadedFileURL= await uploadFile( file[0] )            
            data["productImage"]=uploadedFileURL
        }
      
        if (availableSizes) {
            let sizesArray = availableSizes.split(",").map(x => x.trim())
            

            for (let i = 0; i < sizesArray.length; i++) {
                if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(sizesArray[i]))) {
                    console.log(sizesArray[i])
                    return res.status(400).send({ status: false, message: "AvailableSizes should be among ['S','XS','M','X','L','XXL','XL']" })
                }
            }
        }

        let updateProduct = await productModel.findByIdAndUpdate({_id:pathParams},data,{new:true})

        return res.status(200).send({status:true,message:"success",data:updateProduct})

        

    } catch (error) {
        return res.status(500).send({status:false,message:error.message})
    }
}

const deleteById=async function(req,res){
    try{
        let pathParams=req.params.productId 
        if(!ObjectId.isValid(pathParams)){
            return res.status(400).send({status:false,message:"Please enter valid productId"})
        }
        
        let product=await productModel.findOne({_id:pathParams,isDeleted:false}) 
        if(!product){
            return res.status(404).send({status:false,message:"No product found"})
        }
        
        let deleteProduct=await productModel.findByIdAndUpdate(pathParams,{$set:{isDeleted:true,deletedAt:Date.now()}},{new:true})
        return res.status(200).send({status:true,message: "Product deleted successfully"})
        


    }
    catch(err){
        return res.status(500).send({status:false,message:err.message})
    }

}
 module.exports={createProduct,getProducts,getProductById,updateProduct,deleteById}
  
  