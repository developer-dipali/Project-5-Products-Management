const express= require("express")
const router= express.Router()

const {createUser,loginUser,getUser, updateUser}=require("../controllers/userController")
const {auth}=require("../middleware/auth")
const {createProduct, getProductById, deleteById, getProducts}=require("../controllers/productController")

//USER
router.post("/register",createUser)
router.post("/login",loginUser)
router.get("/user/:userId/profile",auth,getUser)
router.put("/user/:userId/profile",auth,updateUser)

//PRODUCT
router.post("/products",createProduct)
router.get("/products",getProducts)
router.get("/products/:productId",getProductById)
router.delete("/products/:productId",deleteById)

module.exports = router;