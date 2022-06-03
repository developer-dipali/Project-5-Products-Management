const productModel =require("../models/productModel")
const userModel =require("../models/userModel")
const cartModel =require("../models/cartModel")
const ObjectId=require("mongoose").Types.ObjectId
let {isValid,validInstallment,isValidRequestBody}=require("./validator")


//=========================================Create Cart=================================================//
const createCart=async function(req,res){
    try{
    let userId=req.params.userId 
    let data=req.body 

    //Destucturing
    let {productId,cartId}=data 
    let userToken=req.userId
    

    //check userId is Valid ObjectId
    if (!ObjectId.isValid(userId)) {
        return res.status(400).send({ status: false, message: "user id is not valid" })
    }

    //Find User in DB
    const validUser=await userModel.findById(userId);
    if(!validUser){
        return res.status(404).send({status:false,message:"User not present"})
    }

    //Authorisation
    if (userToken !== userId) {
        return res.status(403).send({ status: false, message: "Unauthorized user" })
    }

     //validating empty req body.
    if (!isValidRequestBody(data)) {
        res.status(400).send({ status: false, message: "invalid request parameters.plzz provide user details" })
        return
    }

    //find cart is available for user or not
    let findCart=await cartModel.findOne({userId:userId})
   
    
    if(findCart){

    if(!isValid(cartId)){
        return res.status(400).send({status:false,message:"Please enter cartId"})
    }

    //check cartId is Valid ObjectId
    if (!ObjectId.isValid(cartId)) {
        return res.status(400).send({ status: false, message: "cart id is not valid" })
    }
    }
    
    if(!isValid(productId)){
        return res.status(400).send({status:false,message:"Please enter productId"})
    }
    
  //check productId is Valid ObjectId
    if (!ObjectId.isValid(productId)) {
        return res.status(400).send({ status: false, message: "product id is not valid" })
    }


    //cheak product is available in Product collection which is not deleted

    const validProduct=await productModel.findOne({_id:productId,isDeleted:false})

    if(!validProduct){
        return res.status(404).send({status:false,message:"Product not present"})
    }

    if(!data.quantity){
        data.quantity=1
    }
    else{  
        
    if(!isValid(data.quantity)){
        return res.status(400).send({status:false,message:"Please enter quantity"})
    }

    if(!validInstallment(data.quantity)){
        return res.status(400).send({status:false,message:"Quantity must be a postive no"})
    }
}

let {quantity}=data
    

//if cart is not available for user creat New cart and add product detail from user

    if(!findCart){
        cart={userId:userId,
            items:[{productId:productId,quantity:quantity}],
            totalPrice:quantity*(validProduct.price) ,
            totalItems:1

        }
        
        const newCart=await cartModel.create(cart)
        return res.status(201).send({status:true,message:"Success",data:newCart})
    }
    
    //if cart is available for user add product details from user

    if(findCart){

        if(cartId!=findCart._id){
            return res.status(400).send({status:false,message:`This cart is not present for this user ${userId}`})
        }

        let price = findCart.totalPrice + (quantity * validProduct.price)
        let itemsArr = findCart.items
           
        for (let i=0;i<itemsArr.length;i++) {

            if (itemsArr[i].productId.toString() === productId) {
                
                    itemsArr[i].quantity += quantity

                    let itemAddedInCart = { items: itemsArr, totalPrice: price, totalItems: itemsArr.length }

                    let newData = await cartModel.findOneAndUpdate({ _id: findCart._id }, itemAddedInCart, { new: true })

                    return res.status(201).send({ status: true, message: `Success`, data: newData })
            }
         }
         
        itemsArr.push({ productId: productId, quantity: quantity }) 
        

        let itemAddedInCart = { items: itemsArr, totalPrice: price, totalItems: itemsArr.length }
        let newData = await cartModel.findOneAndUpdate({ _id: findCart._id }, itemAddedInCart, { new: true })

        return res.status(201).send({ status: true, message: `Success`, data: newData })
     } 

    }
    catch(err)
    {
        return res.status(500).send({status:false,message:err.message})
    }

    }


//===================================Update cart(PUT API)==========================================//

    const updateCart = async function (req, res) {
        try {
    
            const userId = req.params.userId
            let data = req.body
    
            //Destructuring
            let { cartId, productId, removeProduct } = data
            let userToken = req.userId

            // user validation
            if (!ObjectId.isValid(userId)) {
                return res.status(400).send({ status: false, message: "user id is not valid" })
            }

            //find user in user collection
            const validUser = await userModel.findById(userId);
            if (!validUser) {
                return res.status(404).send({ status: false, message: "User not present" })
            }
             //Authorisation
            if (userToken !== userId) {
                return res.status(403).send({ status: false, message: "Unauthorized user" })
            }
    
            // checking data in request body
    
            if (!isValidRequestBody(data)) {
                return res.status(400).send({ status: false, message: "Please enter details to update the document" })
    
            }

            // cart validation
            if (!isValid(cartId)) {
                return res.status(400).send({ status: false, message: "Please enter cart id" })
            }

            if (!ObjectId.isValid(cartId)) {
                return res.status(400).send({ status: false, message: "cart id is not valid" })
            }

          //find cartID in cart collection
            const validCart = await cartModel.findOne({ _id: cartId, userId: userId });
            if (!validCart) {
                return res.status(404).send({ status: false, message: "Cart not present" })
            }

            // product validation
            if (!isValid(productId)) {
                return res.status(400).send({ status: false, message: "Please enter product id" })
            }

            if (!ObjectId.isValid(productId)) {
                return res.status(400).send({ status: false, message: "product id is not valid" })
            }

              //find productId in product collection
            const validProduct = await productModel.findOne({ _id: productId, isDeleted: false });
            if (!validProduct) {
                return res.status(404).send({ status: false, message: "Product not present" })
            }

            let items = validCart.items
        
            let productArr = items.filter(x => x.productId.toString() == productId)
            
            if (productArr.length == 0) {
                return res.status(404).send({ status: false, message: "Product is not present in cart" })
            }
    
            let index = items.indexOf(productArr[0])
    
            if (!isValid(removeProduct)) {
                return res.status(400).send({ status: false, message: "Please enter removeProduct" })
            }

            if (!([0, 1].includes(removeProduct))) {
                return res.status(400).send({ status: false, message: "RemoveProduct field can have only 0 or 1 value" })
            }
            
            if (removeProduct == 0) {
                
                validCart.totalPrice = (validCart.totalPrice - (validProduct.price * validCart.items[index].quantity)).toFixed(2)
                validCart.items.splice(index, 1)
    
                validCart.totalItems = validCart.items.length
                validCart.save()
            }

            if (removeProduct == 1) {
              
                validCart.items[index].quantity -= 1
                validCart.totalPrice = (validCart.totalPrice - validProduct.price).toFixed(2)
                
                if (validCart.items[index].quantity == 0) {
                    validCart.items.splice(index,1)
    
                }
                validCart.totalItems = validCart.items.length
    
                validCart.save()
    
            }
            return res.status(200).send({ status: true,message:"Success", data: validCart })
    
    
    
        }
        catch (err) {
            return res.status(500).send({ status: false, message: err.message })
    
        }
    }
    

//=============================================Get API=====================================================//

    const getCart=async function(req,res){
        try{
            let userId=req.params.userId 
            let userToken=req.userId
        

        //check productId is Valid ObjectId
          if (!ObjectId.isValid(userId)) {
          return res.status(400).send({ status: false, message: "user id is not valid" })
        }

        //search userID in User Collection
        const validUser=await userModel.findById(userId);

       if(!validUser){
        return res.status(404).send({status:false,message:"User not present"})
    }
        //Authorisation
        if (userToken !== userId) {
        return res.status(403).send({ status: false, message: "Unauthorized user" })
         }

        //search userID in cart Collection
        let findCart=await cartModel.findOne({userId:userId}).populate("items.productId")

        if(!findCart){
        return res.status(404).send({status:false,message:"Cart is not present with this particular user id"})
    }


    return res.status(200).send({status:true,message:"Success",data:findCart})
        }
        catch(err){
            return res.status(500).send({status:false,message:err.message})
            
        }
    }



    //=======================================================delete Cart API=========================================//
    const deleteCart=async function(req,res){
      try{
            let userId=req.params.userId 
            let userToken=req.userId

        //check productId is Valid ObjectId
          if (!ObjectId.isValid(userId)) {
          return res.status(400).send({ status: false, message: "user id is not valid" })
        }

        //search userID in user Collection
        const validUser=await userModel.findById(userId);

       if(!validUser){
        return res.status(404).send({status:false,message:"User not present"})
        }
        //Authorisation
        if (userToken !== userId) {
        return res.status(403).send({ status: false, message: "Unauthorized user" })
         }

        //search userID in cart Collection
        let findCart=await cartModel.findOne({userId:userId})

        if(!findCart){
        return res.status(404).send({status:false,message:"Cart is not present with this particular user id"})
        }

        if(findCart.totalPrice==0 && findCart.totalItems==0 && findCart.items.length==0){
        return res.status(400).send({status:false,message:"Cart is empty"})
    }
    
    //only empty the cart details 
    let cart={
        items:[],
        totalPrice:0,
        totalItems:0
    }

    await cartModel.findByIdAndUpdate(findCart._id,cart)
    return res.status(204).send({status:true,message:"Success"})

        }
        catch(err){
            return res.status(500).send({status:false,message:err.message})

        }
    }
    


    

module.exports={createCart,updateCart,getCart,deleteCart}