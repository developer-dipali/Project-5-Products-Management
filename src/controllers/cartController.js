const productModel =require("../models/productModel")
const userModel =require("../models/userModel")
const cartModel =require("../models/cartModel")
const ObjectId=require("mongoose").Types.ObjectId
let {isValid,isValidIncludes,validInstallment,validString,isValidRequestBody}=require("./validator")
const { find } = require("../models/productModel")

const createCart=async function(req,res){
    try{
    let userId=req.params.userId 
    let data=req.body 
    let {productId,quantity}=data 
    let userToken=req.userId
    if (!ObjectId.isValid(userId)) {
        return res.status(400).send({ status: false, message: "user id is not valid" })
    }
    const validUser=await userModel.findById(userId);
    if(!validUser){
        return res.status(404).send({status:false,message:"User not present"})
    }
    //Authorisation
    // if (userToken !== userId) {
    //     return res.status(403).send({ status: false, message: "Unauthorized user" })
    // }
    if (!isValidRequestBody(data)) {
        res.status(400).send({ status: false, message: "invalid request parameters.plzz provide user details" })
        return
    }
    if(!isValid(productId)){
        return res.status(400).send({status:false,message:"Please enter productId"})
    }
    if (!ObjectId.isValid(productId)) {
        return res.status(400).send({ status: false, message: "product id is not valid" })
    }

    const validProduct=await productModel.findOne({_id:productId,isDeleted:false})
    if(!validProduct){
        return res.status(404).send({status:false,message:"Product not present"})
    }
    if(!isValid(quantity)){
        return res.status(400).send({status:false,message:"Please enter quantity"})
    }
    if(!validInstallment(quantity)){
        return res.status(400).send({status:false,message:"Quantity must be a postive no"})
    }
    let findCart=await cartModel.findOne({userId:userId})
    
    
    if(!findCart){
        cart={userId:userId,
            items:[{productId:productId,quantity:quantity}],
            totalPrice:quantity*(validProduct.price) ,
            totalItems:1

        }
        // data.userId=userId
        // data.items=[{productId:productId,quantity:quantity}]
        // data.totalPrice=quantity*(validProduct.price)
        // data.totalItems=1
        const newCart=await cartModel.create(cart)
        return res.status(201).send({status:true,message:"cart created successfully",data:newCart})
    }
    if(findCart){
        let price = findCart.totalPrice + (quantity * validProduct.price)
        let itemsArr = findCart.items
        

            
        for (let i=0;i<itemsArr.length;i++) {
            if (itemsArr[i].productId.toString() === productId) {
                    itemsArr[i].quantity += quantity

                    let itemAddedInCart = { items: itemsArr, totalPrice: price, totalItems: itemsArr.length }

                    let newData = await cartModel.findOneAndUpdate({ _id: findCart._id }, itemAddedInCart, { new: true })

                    return res.status(200).send({ status: true, message: `Product added successfully`, data: newData })
            }
         }
         
        itemsArr.push({ productId: productId, quantity: quantity }) 
        console.log(itemsArr)

        let itemAddedInCart = { items: itemsArr, totalPrice: price, totalItems: itemsArr.length }
        let newData = await cartModel.findOneAndUpdate({ _id: findCart._id }, itemAddedInCart, { new: true })

        return res.status(200).send({ status: true, message: `Product added successfully`, data: newData })
     } 
    }catch(err){
        return res.status(500).send({status:false,message:err.message})
    }

    }

    const updateCart=async function(req,res){
        try{
           const userId=req.params.userId 
           let data=req.body
           let {cartId,productId,removeProduct}=req.body 
           let userToken=req.userId

           if (!ObjectId.isValid(userId)) {
            return res.status(400).send({ status: false, message: "user id is not valid" })
          }
          if(!isValidRequestBody(data)){
              return res.status(400).send({status:false,message:"Please enter details to update the document"})

          }
          if(!isValid(cartId)){
              return res.status(400).send({status:false,message:"Please enter cart id"})
          }
          if(!isValid(productId)){
            return res.status(400).send({status:false,message:"Please enter product id"})
        }
        if(!isValid(removeProduct)){
            return res.status(400).send({status:false,message:"Please enter removeProduct"})
        }
          const validUser=await userModel.findById(userId);
       if(!validUser){
        return res.status(404).send({status:false,message:"User not present"})
    }
        //Authorisation
        // if (userToken !== userId) {
        //     return res.status(403).send({ status: false, message: "Unauthorized user" })
        // }

          if (!ObjectId.isValid(cartId)) {
            return res.status(400).send({ status: false, message: "cart id is not valid" })
          }
          const validCart=await cartModel.findById(cartId);
         if(!validCart){
        return res.status(404).send({status:false,message:"Cart not present"})
        }
        
          if (!ObjectId.isValid(productId)) {
            return res.status(400).send({ status: false, message: "product id is not valid" })
          }
          const validProduct=await productModel.findOne({_id:productId,isDeleted:false});
       if(!validProduct){
        return res.status(404).send({status:false,message:"Product not present"})
    }
          let items=validCart.items 
        //   let c=0
        //   console.log(items)
        //   for(let i=0;i<items.length;i++){
        //       if((i.productId).toString()==productId){
        //           c++;
        //       }
        //   }
        //   if(c==0){
        //     return res.status(404).send({status:false,message:"Product is not present in cart"}) 
        //   }
          //console.log(c)
          console.log(items)
          let productArr=items.filter(x=>x.productId.toString()==productId )
        console.log(productArr.length)
          if(productArr.length==0){
              return res.status(404).send({status:false,message:"Product is not present in cart"})
          }
          let index=items.indexOf(productArr[0])
          console.log(productArr)
          console.log(typeof removeProduct)
          console.log((removeProduct!=0) || (removeProduct!=1))
          if(!([0,1].includes(removeProduct))){
              return res.status(400).send({status:false,message:"RemoveProduct field can have only 0 or 1 value"})
          }
          //let index=productArr[0]
          if(removeProduct==0){
              console.log(1)
              validCart.totalPrice=validCart.totalPrice-(validProduct.price*validCart.items[index].quantity)
              validCart.items.splice(index,1)
              
              validCart.totalItems=validCart.items.length
              validCart.save()



              

          }
          if(removeProduct==1){
              if(validCart.items[index].quantity==0){
                validCart.items.splice(index)

              }
              validCart.items[index].quantity-=1
              validCart.totalPrice=validCart.totalPrice-validProduct.price
              validCart.totalItems=validCart.items.length
              
              validCart.save()
              
          }
          return res.status(200).send({status:true,data:validCart})
          
          

        }
        catch(err){
            return res.status(500).send({status:false,message:err.message})

        }
    }


    const getCart=async function(req,res){
        try{
            let userId=req.params.userId 
            let userToken=req.userId
          if (!ObjectId.isValid(userId)) {
          return res.status(400).send({ status: false, message: "user id is not valid" })
        }
        const validUser=await userModel.findById(userId);
       if(!validUser){
        return res.status(404).send({status:false,message:"User not present"})
    }
    //Authorisation
    // if (userToken !== userId) {
    //     return res.status(403).send({ status: false, message: "Unauthorized user" })
    // }
    let findCart=await cartModel.findOne({userId:userId})
    if(!findCart){
        return res.status(404).send({status:false,message:"Cart is not present with this particular user id"})
    }
    return res.status(200).send({status:true,data:findCart})

        }
        catch(err){
            return res.status(500).send({status:false,message:err.message})
            
        }
    }

    const deleteCart=async function(req,res){
      try{
            let userId=req.params.userId 
            let userToken=req.userId
          if (!ObjectId.isValid(userId)) {
          return res.status(400).send({ status: false, message: "user id is not valid" })
        }
        const validUser=await userModel.findById(userId);
       if(!validUser){
        return res.status(404).send({status:false,message:"User not present"})
    }
    //Authorisation
    // if (userToken !== userId) {
    //     return res.status(403).send({ status: false, message: "Unauthorized user" })
    // }
    let findCart=await cartModel.findOne({userId:userId})
    if(!findCart){
        return res.status(404).send({status:false,message:"Cart is not present with this particular user id"})
    }
    if(findCart.totalPrice==0 && findCart.totalItems==0 && findCart.items.length==0){
        return res.status(400).send({status:false,message:"Cart is empty"})
    }
    
    let cart={
        items:[],
        totalPrice:0,
        totalItems:0
    }
    await cartModel.findByIdAndUpdate(findCart._id,cart)
    return res.status(204).send({status:true,message:"Cart deleted successfully"})

        }
        catch(err){
            return res.status(500).send({status:false,message:err.message})

        }
    }
    

   

    
    
    

    

module.exports={createCart,updateCart,getCart,deleteCart}