const express= require("express")
const router= express.Router()

const {createUser,loginUser,getUser, updateUser}=require("../controllers/userController")
const {auth}=require("../middleware/auth")
const {createProduct, getProductById, deleteById, getProducts,updateProduct}=require("../controllers/productController")
const {createCart, deleteCart, getCart, updateCart}=require("../controllers/cartController")
const {createOrder, updateOrder}=require("../controllers/orderController")

//USER
router.post("/register",createUser)
router.post("/login",loginUser)
router.get("/user/:userId/profile",auth,getUser)
router.put("/user/:userId/profile",auth,updateUser)

//PRODUCT
router.post("/products",createProduct)
router.get("/products",getProducts)
router.get("/products/:productId",getProductById)
router.put("/products/:productId",updateProduct)
router.delete("/products/:productId",deleteById)

//CART
router.post("/users/:userId/cart",auth,createCart)
router.put("/users/:userId/cart",auth,updateCart)
router.get("/users/:userId/cart",auth,getCart)
router.delete("/users/:userId/cart",auth,deleteCart)

//ORDER 
router.post("/users/:userId/orders",auth,createOrder)
router.put("/users/:userId/orders",auth,updateOrder)

module.exports = router;