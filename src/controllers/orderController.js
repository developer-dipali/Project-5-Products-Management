const productModel =require("../models/productModel")
const userModel =require("../models/userModel")
const cartModel =require("../models/cartModel")
const orderModel =require("../models/orderModel")
const ObjectId=require("mongoose").Types.ObjectId
let {isValid,isValidIncludes,validInstallment,validString,isValidRequestBody}=require("./validator")



//========================================create Order API=====================================================//
const createOrder=async function(req,res){
    try{

    let userId=req.params.userId 
    let data=req.body 

    //DEstructuring
    let {cartId,cancellable,status}=data
   
    
    let userToken=req.userId

    //check productId is Valid ObjectId
    if (!ObjectId.isValid(userId)) {
        return res.status(400).send({ status: false, message: "user id is not valid" })
    }

    //find userID in user collection
    const validUser=await userModel.findById(userId);

    if(!validUser){
        return res.status(404).send({status:false,message:"User not present"})
    }

    //Authorisation
    if (userToken !== userId) {
        return res.status(403).send({ status: false, message: "Unauthorized user" })
    }

    //validation for empty Request body
    if (!isValidRequestBody(data)) {
        res.status(400).send({ status: false, message: "invalid request parameters.plzz provide user details" })
        return
    }

    if(!isValid(cartId)){
        return res.status(400).send({status:false,message:"Please enter cartId"})
    }
    if (!ObjectId.isValid(cartId)) {
        return res.status(400).send({ status: false, message: "cart id is not valid" })
    }

    //find cartID in cart collection
    const findCart=await cartModel.findOne({_id:cartId,userId:userId})

    if(!findCart){
        return res.status(404).send({status:false,message:"No cart found"})
    }


    let itemsArr=findCart.items 
    if(itemsArr.length==0){
        return res.status(400).send({status:false,message:"Cart is empty"})
    }

    let sum=0
    for(let i of itemsArr){
        sum+=i.quantity
        
    }


    //create Object to add data
    let newData={
        userId:userId,
        items:findCart.items,
        totalPrice:findCart.totalPrice,
        totalItems:findCart.totalItems,
        totalQuantity:sum


    }
     
    //validation
    if(isValidIncludes("cancellable",data)){
        if(!isValid(cancellable)){
            return res.status(400).send({status:false,message:"Please enter cancellable"})
        }
        if (![true, false].includes(cancellable)) {
            return res.status(400).send({ status: false, message: "cancellable must be a boolean value" })
        }
        newData.cancellable=cancellable

    }
    if(isValidIncludes("status",data)){
        if(!isValid(status)){
            return res.status(400).send({status:false,message:"Please enter status"})
        }
        if (!["pending", "completed", "canceled"].includes(status)) {
            return res.status(400).send({ status: false, message: "status must be a pending,completed,canceled" })
        }
        newData.status=status

    }
    const orderCreated=await orderModel.create(newData)
    
    //here order is done thats why making cart empty
    findCart.items=[]
    findCart.totalItems=0 
    findCart.totalPrice=0
    findCart.save()

    return res.status(201).send({status:true,message:"Success",data:orderCreated})
    


    }
    catch(err){
        return res.status(500).send({status:false,message:err.message})
    }
}


//==============================================Update Order API======================================================//


const updateOrder=async function(req,res){
    try{
        let userId=req.params.userId 
    let data=req.body 

    //Destructuring
    let {orderId,status}=data
   
    let userToken=req.userId

    //check usertId is Valid ObjectId
    if (!ObjectId.isValid(userId)) {
        return res.status(400).send({ status: false, message: "user id is not valid" })
    }
    const validUser=await userModel.findById(userId);
    if(!validUser){
        return res.status(404).send({status:false,message:"User not present"})
    }
    //Authorisation
    if (userToken !== userId) {
        return res.status(403).send({ status: false, message: "Unauthorized user" })
    }

    //validation for empty Request body
    if (!isValidRequestBody(data)) {
        res.status(400).send({ status: false, message: "invalid request parameters.plzz provide user details" })
        return
    }

    if(!isValid(orderId)){
        return res.status(400).send({status:false,message:"Please enter orderId"})
    }

    //check usertId is Valid ObjectId
    if (!ObjectId.isValid(orderId)) {
        return res.status(400).send({ status: false, message: "order id is not valid" })
    }

    //search orderID  is available in order collection or not
    const checkOrder=await orderModel.findOne({_id:orderId,isDeleted:false});
    if(!checkOrder){
        return res.status(404).send({status:false,message:"Order not present"})
    }
    

    //validation
    if(!isValid(status)){
        return res.status(400).send({status:false,message:"Please enter status"})
    }

    //Status must contain Enum value
    status=status.toLowerCase()
    if (!["pending", "completed", "canceled"].includes(status)) {
        return res.status(400).send({ status: false, message: "status must be a pending,completed,canceled" })
    }

    if(checkOrder.userId!=userId){
        return res.status(404).send({status:false,message:"Order id and user id doesnot match"})

    }

    if((status=="pending" || status=="canceled") && checkOrder.status=="completed"){
        return res.status(400).send({status:false,message:"You can't change status once it is completed"})
    }

    if((status=="pending" || status=="completed") && checkOrder.status=="canceled"){
        return res.status(400).send({status:false,message:"You can't change status once it is canceled"})
    }

    if(status=="canceled" && checkOrder.cancellable==false){
    
        return res.status(400).send({status:false,message:"You can't update as cancellable is not true"})
    }
    
    //Order Updated
    const newData=await orderModel.findByIdAndUpdate({_id:orderId},{$set:{status:status}},{new:true})
    return res.status(200).send({status:true,message:"Success",data:newData})

    }
    catch(err){
        return res.status(500).send({status:false,message:err.message})

    }
}


module.exports={createOrder,updateOrder}