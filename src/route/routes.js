const express= require("express")
const router= express.Router()

const {createUser,loginUser,getUser, updateUser}=require("../controllers/userController")
const {auth}=require("../middleware/auth")


router.post("/register",createUser)

router.post("/login",loginUser)

router.get("/user/:userId/profile",auth,getUser)
router.put("/user/:userId/profile",auth,updateUser)

module.exports = router;