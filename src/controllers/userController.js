const userModel = require("../models/userModel")
const ObjectId = require("mongoose").Types.ObjectId
const aws = require("aws-sdk")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { AutoScaling } = require("aws-sdk")
const { uploadFile } = require("./aws")
let {isValid,isValidIncludes,validInstallment,validString,isValidRequestBody}=require("./validator")



//================================Create User API=============================//
const createUser = async (req, res) => {

    try {
        let data = req.body
        let file = req.files

        //=======Request Body data validation===>

        if (!isValidRequestBody(data) && (file == undefined || file.length == 0)) {
            res.status(400).send({ status: false, message: "invalid request parameters.plzz provide user details" })
            return
        }

        //==========destructuring=======/

        let { fname, lname, email, password, phone, address } = data


        //===============Validate attributes===============//
        if (!isValid(fname)) {
            res.status(400).send({ status: false, message: " first name is required" })
            return
        }

        if (!/^[A-Za-z\s]{1,}[\.]{0,1}[A-Za-z\s]{0,}$/.test(fname)) {
            return res.status(400).send({ status: false, message: "Please enter valid user first name." })
        }


        // name validation===>
        if (!isValid(lname)) {
            res.status(400).send({ status: false, message: "last name is required" })
            return
        }


        //this will validate the type of name including alphabets and its property with the help of regex.
        if (!/^[A-Za-z\s]{1,}[\.]{0,1}[A-Za-z\s]{0,}$/.test(lname)) {
            return res.status(400).send({ status: false, message: "Please enter valid user last name." })
        }


        //Email Validation===>
        if (!isValid(email)) {
            return res.status(400).send({ status: false, message: "plzz enter email" })
        }


        //email regex validation for validate the type of email.
        email = email.toLowerCase().trim()
        const emailPattern = /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})/

        if (!email.match(emailPattern)) {
            return res.status(400).send({ status: false, message: "This is not a valid email" })
        }


        //searching Email in DB to maintain their uniqueness.
        const emailExt = await userModel.findOne({ email: email })
        if (emailExt) {
            return res.status(400).send({ status: false, message: "Email already exists" })
        }


        //Password Validations===>
        if (!isValid(password)) {
            return res.status(400).send({ status: false, message: "plzz enter password" })
        }

        // cheack password length between 8 to 15
        password = password.trim()
        if (password.length < 8 || password.length > 15) {
            return res.status(400).send({ status: false, message: "password length should between 8 to 15" })
        }

        //Ganeration of encrypted Password
        const salt = await bcrypt.genSalt(10)
        data.password = await bcrypt.hash(password, salt)
        console.log(data.password)



        //Phone Validations===>
        if (!isValid(phone)) {
            return res.status(400).send({ status: false, message: "plzz enter mobile" })
        }

        //this regex will to set the phone no. length to 10 numeric digits only.
        if (!/^(\+91)?0?[6-9]\d{9}$/.test(phone.trim())) {
            return res.status(400).send({ status: false, message: "Please enter valid 10 digit mobile number." })
        }


          //searching Phone in DB to maintain their uniqueness.
        const phoneExt = await userModel.findOne({ phone: phone })
        if (phoneExt) {
            return res.status(400).send({ status: false, message: "phone number already exists" })
        }

        //for address validation===>
        if (!address) {
            return res.status(400).send({ status: false, message: "address is required" })
        }
        
        if(data.address[0]!='{' || data.address[data.address.length-1]!='}'){
            return res.status(400).send({status:false,message:"Address must be in object"})
        }
        data.address = JSON.parse(data.address)


        // this validation will check the address is in the object format or not

        
        let { shipping, billing } = data.address        //destructuring
        if(Object.keys(data.address).length==0){
            return res.status(400).send({status:false,message:"No keys are present in address"})
        }


        //Shipping field validation==>

        if (!shipping) {
            return res.status(400).send({ status: false, message: "shipping is required" })
        }

        if (typeof shipping != "object") {
            return res.status(400).send({ status: false, message: "shipping should be an object" })
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


        //applicable only for numeric values and extend to be 6 characters only==>

        if (!/^\d{6}$/.test(shipping.pincode)) {
            return res.status(400).send({ status: false, message: "plz enter valid shipping pincode" });
        }


        //Billing Field validation==>

        if (!billing) {
            return res.status(400).send({ status: false, message: "billing is required" })
        }

        if (typeof billing != "object") {
            return res.status(400).send({ status: false, message: "billing should be an object" })
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

        //applicable only for numeric values and extend to be 6 characters only

        if (!/^\d{6}$/.test(billing.pincode)) {
            return res.status(400).send({ status: false, message: "plz enter valid  billing pincode" });
        }


        //saving aws link of ProfileImage

        if (file && file.length > 0) {
            let uploadedFileURL = await uploadFile(file[0])
            data["profileImage"] = uploadedFileURL
        }
        else {
            return res.status(400).send({ status: false, message: "No file found" })
        }


        ///Creating User Data====>

        let saveData = await userModel.create(data)
        return res.status(201).send({ status: true, message: "success", data: saveData })

    }

    catch (error) {
        return res.status(500).send({ status: "error", message: error.message })
    }



}



//==================================Login ApI=====================================//


const loginUser = async function (req, res) {
    try {
        const requestBody = req.body;

        //cheacking Empty request Body 
        if (!isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, msg: "please provide data to signIn" });
        }

        //Destructuring
        let { email, password } = requestBody;


        // //Email Validation===>
        if (!isValid(email)) {
            return res.status(400).send({ status: false, msg: "please provide email" });
        }

        //email regex validation for validate the type of email.
        email = email.toLowerCase().trim()
        const emailPattern = /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})/
        if (!email.match(emailPattern)) {
            return res.status(400).send({ status: false, message: "This is not a valid email" })
        }


        //Password Validations===>
        if (!isValid(password)) {
            return res.status(400).send({ status: false, msg: "please provide password" });
        }


        //// cheack password length between 8 to 15
        password = password.trim()
        if (password.length < 8 || password.length > 15) {
            return res.status(400).send({ status: false, message: "plzz enter valid password" })
        }


            //searching Email in DB 
        const emailCheck = await userModel.findOne({ email: email })
        if (!emailCheck) {
            return res.status(404).send({ status: false, message: "Email not found" })
        }

        //matching of encrypted Password
        const dbPassword = emailCheck.password
        
        const passwordMathched = await bcrypt.compare(password, dbPassword)
        console.log(passwordMathched)
        if (!passwordMathched) {
            return res.status(401).send({ status: false, message: "Please provide valid credentils" })
        }

        //Ganeration of JWT Token

        const userId = emailCheck._id;
        const data = { email, password };
        if (data) {
            const token = jwt.sign(
                {
                    userId: userId

                },
                "project5", { expiresIn: "24hr" }
            );
            res.status(200).send({ status: true, msg: "user login sucessfully", data: { userId: userId, token: token } });
        }
    } catch (err) {
        res.status(500).send({ status: false, data: err.message });
    }
};





//===========================================GET User DATA API=====================================================//

const getUser = async function (req, res) {
    try {

        //taking UserID from Params
        let pathParams = req.params.userId

        //cheacking for UserID Is valid ObjectID
        if (!ObjectId.isValid(pathParams)) {
            return res.status(400).send({ status: false, message: "Please enter valid userId" })
        }

        //Authrization
        let userToken = req.userId
        
        if (!ObjectId.isValid(userToken)) {
            return res.status(400).send({ status: false, message: "Please enter valid userId" })
        }

        let user = await userModel.findOne({ _id: pathParams })
        if (!user) {
            return res.status(404).send({ status: false, message: "No user found" })
        }

        if (userToken !== pathParams) {
            return res.status(403).send({ status: false, message: "Unauthorized user" })
        }

        let data = await userModel.findOne({ _id: pathParams })
        return res.status(200).send({ status: true, message: "User profile details", data: data })


    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}




//========================================PUT API-Update User Data===================================================//
const updateUser = async function (req, res) {
    try {

        //Ganeration of encrypted Password
        let pathParams = req.params.userId

        //cheack for UserID Is valid ObjectID
        if (!ObjectId.isValid(pathParams)) {
            return res.status(400).send({ status: false, message: "user id is not valid" })
        }

        //Authrization
        let authorToken = req.userId
        
        if (!ObjectId.isValid(authorToken)) {
            return res.status(400).send({ status: false, message: "Please enter valid userId" })
        }

        let user = await userModel.findOne({ _id: pathParams })
        if (!user) {
            return res.status(404).send({ status: false, message: "No user found" })
        }

        if (authorToken !== pathParams) {
            return res.status(403).send({ status: false, message: "Unauthorized user" })
        }

        //fetching data from Request Body
        let data = req.body
        let file = req.files

        if (file && file.length > 0) {
            let uploadedFileURL = await uploadFile(file[0])
            data["profileImage"] = uploadedFileURL
        }


        if (!isValidRequestBody(data) && (file == undefined || file.length == 0)) {
            return res.status(400).send({ status: false, message: "plz enter valid data for updation" })

        }

        //Destructuring
        let { email, phone, lname, fname, password, address } = data
        console.log(address)


        //Email Validtion
        if (isValidIncludes("email", data)) {
            if (!isValid(email)) {
                return res.status(400).send({ status: false, message: "plzz enter email" })
            }

            //email regex validation for validate the type of email.
            email = email.toLowerCase().trim()
            const emailPattern = /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})/


            if (!email.match(emailPattern)) {
                return res.status(400).send({ status: false, message: "This is not a valid email" })
            }


            const emailExt = await userModel.findOne({ email: email })
            if (emailExt) {
                return res.status(400).send({ status: false, message: "Email already exists" })
            }
            data.email = email

        }

        //Phone Validation

        if (isValidIncludes("phone", data)) {
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
            data.phone = phone

        }


        //Fname Vaidation
        if (isValidIncludes("fname", data)) {

            if (!isValid(fname)) {
                return res.status(400).send({ status: false, message: "Please enter valid fname" })
            }
            data.fname = fname

        }

        //Lname Validation
        if (isValidIncludes("lname", data)) {
            if (!isValid(lname)) {
                return res.status(400).send({ status: false, message: "Please enter valid lname" })

            }
            data.lname = lname
        }


        //password validation
        if (isValidIncludes("password", data)) {
            if (!isValid(password)) {
                return res.status(400).send({ status: false, message: "plzz enter password" })
            }


            //check password length between 8-15
            password = password.trim()
            if (password.length < 8 || password.length > 15) {
                return res.status(400).send({ status: false, message: "plzz enter valid password" })
            }


            //Password Encryption
            const salt = await bcrypt.genSalt(10)
            data.password = await bcrypt.hash(password, salt)
            

        }


        //address validation
        if (isValidIncludes("address", data)) {
            
            if (!isValid(address)) {
                return res.status(400).send({ status: false, message: "plzz enter address" })
            }

            
            if(data.address[0]!='{' || data.address[data.address.length-1]!='}'){
                return res.status(400).send({status:false,message:"Address must be in object"})
            }
            
            data.address = JSON.parse(data.address)
            

            
            if (Object.keys(data.address).length == 0) {
                return res.status(400).send({ status: false, message: "No keys are given in address" })

            }

            //Destructuring
            let { shipping, billing } = data.address

            
            //Shipping Feild Validation
            if (shipping) {

                if (typeof shipping != "object") {
                    return res.status(400).send({ status: false, message: "Shipping must be in object" })
                }

                if (Object.keys(shipping).length == 0) {
                    return res.status(400).send({ status: false, message: "No keys are given in shipping" })
                }


                //Destructuring

                let { street, city, pincode } = shipping

                if (street) {
                    if (!isValid(street)) {
                        return res.status(400).send({ status: false, message: "shipping street is required" })
                    }
                    data.address.shipping.street = shipping.street
                }

                if (city) {
                    if (!isValid(shipping.city)) {
                        return res.status(400).send({ status: false, message: "shipping city is required" })
                    }

                    if (!/^[a-zA-Z]+$/.test(shipping.city)) {
                        return res.status(400).send({ status: false, message: "city field have to fill by alpha characters" });
                    }

                    data.address.shipping.city = shipping.city

                } if (pincode) {
                    if (!isValid(pincode)) {
                        return res.status(400).send({ status: false, message: "Shipping pincode is required" })
                    }

                    //applicable only for numeric values and extend to be 6 characters only--
                    if (!/^\d{6}$/.test(pincode)) {
                        return res.status(400).send({ status: false, message: "plz enter valid  shipping pincode" });
                    }

                    data.address.shipping.pincode = shipping.pincode

                }
            }



            //Billing Feild Validation
            if (billing) {

                if (typeof billing != "object") {
                    return res.status(400).send({ status: false, message: "billing must be in object" })
                }
                if (Object.keys(billing).length == 0) {
                    return res.status(400).send({ status: false, message: "No keys are given in billing" })

                }

                //Destructuring
                let { street, city, pincode } = billing
                if (street) {
                    if (!isValid(street)) {
                        return res.status(400).send({ status: false, message: "billing street is required" })
                    }
                    data.address.billing.street = billing.street

                }


                if (city) {
                    if (!isValid(billing.city)) {
                        return res.status(400).send({ status: false, message: "billing city is required" })
                    }

                    if (!/^[a-zA-Z]+$/.test(billing.city)) {
                        return res.status(400).send({ status: false, message: "city field have to fill by alpha characters" });
                    }

                    data.address.billing.city = billing.city

                } if (pincode) {
                    if (!isValid(pincode)) {
                        return res.status(400).send({ status: false, message: "billing pincode is required" })
                    }

                    //applicable only for numeric values and extend to be 6 characters only--
                    if (!/^\d{6}$/.test(billing.pincode)) {
                        return res.status(400).send({ status: false, message: "plz enter valid  billing pincode" });
                    }

                    data.address.billing.pincode = billing.pincode

                }
            }

        }


        //taking perticular value from Address Feild And Update accordingly
        data.address = {
            shipping: {
                street: data.address?.shipping?.street || user.address.shipping.street,
                city: data.address?.shipping?.city || user.address.shipping.city,
                pincode: data.address?.shipping?.pincode || user.address.shipping.pincode
            },
            billing: {
                street: data.address?.billing?.street || user.address.billing.street,
                city: data.address?.billing?.city || user.address.billing.city,
                pincode: data.address?.billing?.pincode || user.address.billing.pincode

            }

        }


        //Upadate data and Save
        let updatedData = await userModel.findByIdAndUpdate({ _id: pathParams }, data, { new: true })
        return res.status(200).send({ status: true,message: 'Success', data: updatedData })


    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

module.exports = { createUser, loginUser, getUser, updateUser }