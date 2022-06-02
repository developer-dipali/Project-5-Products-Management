const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    fname: {
        type: String,
        required: true,
        trim:true
    },
    lname: {
        type: String,
        required: true,
        trim:true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim:true, validate:{
            validator:function(v){
                return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
            },
            message:"This is not a valid email"
        } 
    },
    profileImage: {
        type: String,
        required: true
    }, // s3 link
    phone: {
        type: String,
        required: true,
        unique: true,
        trim:true,
        validate:{
            validator:function(v){
                return /^(\+91)?0?[6-9]\d{9}$/.test.test(v);
            },
            message:"Please enter valid 10 digit mobile number"
        } 
        
    },
    password: {
        type: String,
        required: true,
        minLength:8,
        maxLength:15
        
    }, 
    address: {
        shipping: {
            street: {
                type: String,
                required: true,
                trim:true
            },
            city: {
                type: String,
                required: true,
                trim:true
            },
            pincode: {
                type: Number,
                required: true,
                trim:true
            }
        },
        billing: {
            street: {
                type: String,
                required: true,
                trim:true
            },
            city: {
                type: String,
                required: true,
                trim:true
            },
            pincode: {
                type: Number,
                required: true,
                trim:true
            }
        }
    }
},
{timestamps:true}
)
module.exports = mongoose.model("user",userSchema)