const Exception = require('../../lib/exception');
const Response = require('../../lib/response');
const Utils = require('../../lib/utils');
const User = require('../models/user');
const validator = require('validator');
const SMTP = require('../../lib/smtp');
const EmailTemplates = require('email-templates');
const path = require('path');
const Moment = require('moment');
const lodash= require('lodash');
const Hashes = require('jshashes');
const MD5 = new Hashes.MD5;
const SMSApi = require('../../lib/sms-api');
const ContestUserHousey = require('../models/contest_user_housey');
const vouchercode = require('voucher-code-generator');
const Transaction = require('../models/transaction');
const Razorpay = require('razorpay');

const instance = new Razorpay({
    key_id: global.CONFIG['razorpay']['keyid'],
    key_secret: global.CONFIG['razorpay']['keysecret']
});
const Order = require('../models/order');
const Payment = require('../models/payment');
class UserController {
    
    static async userSignUp(request, handler) {
        try {
            const firstName = request.payload.FirstName;
            const lastName = request.payload.LastName;
            const email = request.payload.Email;
            const mobile = request.payload.Mobile;
            const DeviceId =request.payload.DeviceId;
            const password = request.payload.Password;
            const OTPCode=Utils.generateOPT();
            const activationToken = Utils.generateActivationToken();
            const reffralCode = request.payload.ReffralCode;
           
            let userObject='';
            const customerResultPhone = await User.findOne({"Mobile":mobile}).lean();

            if(customerResultPhone!=null && customerResultPhone!='null'){
                return new Exception('ValidationError','Sorry! Mobile number is already exists, please try again with new mobile number.').sendError();
            }
            let userDetail ='';
            if(reffralCode){
                userDetail = await User.findOne({"ReffralCode":reffralCode}).lean();

                if(userDetail==null || userDetail=='null'){
                    return new Exception('ValidationError','Sorry! ReffralCode is not exists, please try again with Valid ReffralCode.').sendError();
                }
            }

            const reffralCodeArray= vouchercode.generate({
                length: 8,
                count: 1
            });

            const postData = {};
            postData.FirstName=firstName;
            postData.LastName=lastName;
            postData.Email=email;
            postData.Mobile=mobile;
            postData.DeviceId=DeviceId;
            postData.Password=MD5.hex(password);
            postData.MobileOTP =OTPCode;
            postData.ActivationToken =activationToken;
            postData.ExpiryDate=new Date().getTime()+global.CONFIG['token']['expired'];
            postData.Status = false;
            postData.ReffralCode=reffralCodeArray[0];
            postData.WalletAmount=0;
            postData.BonusAmount=50;
            postData.CreatedAt = new Moment();

            const smsApiResult = await new SMSApi(request).sendOTP('This OTP is from HTG,Your OTP is '+OTPCode,'+91'+mobile,OTPCode);

            postData.SMSResponse =smsApiResult;
            if(smsApiResult.type == "error"){
                return new Exception('GeneralError',smsApiResult.message).sendError();
            }else{
                const userObj = new User(postData);
                userObject= await userObj.save();

            }
            if(userDetail){
                await User.findOneAndUpdate({"_id": userDetail._id}, {$set: {BonusAmount: (parseFloat(userDetail.BonusAmount)+30)}});
                //TODO:
                const postData = {};
                postData.UserId =userDetail._id;
                postData.Description ='Add Bonus Amount';
                postData.Type= 0; //0=Bonus Amount,1=Add Amount In to Wallet 2= Amount Withdrawn from  Wallet
                postData.Amount =30;
                postData.CreatedAt = new Moment();
                const transactionObj = new Transaction(postData);
                await transactionObj.save();

                const postData1 = {};
                postData1.UserId =userObject._id;
                postData1.Description ='Add Bonus Amount';
                postData1.Type= 0; //0=Bonus Amount,1=Add Amount In to Wallet 2= Amount Withdrawn from  Wallet
                postData1.Amount =50;
                postData1.CreatedAt = new Moment();
                const transactionObj1 = new Transaction(postData1);
                await transactionObj1.save();
            }
            // const templatesDir = path.resolve(global.ROOT_PATH, 'templates');
            // const emailContent = new EmailTemplates({ views: { root: templatesDir } });
            // const obj = {
            //     Code: activationToken,
            //     Name: result.FirstName +' '+ result.LastName,
            //     Link: global.CONFIG['SMTP']['baseURL']+"/useractivate/"+activationToken
            // };
            // const mailOptions = {
            //     from: global.CONFIG['SMTP']['from'], // sender address
            //     to: email, // list of receivers
            //     subject: 'User SignUp', // Subject line
            //     html: await emailContent.render('user/signup.ejs', obj)// plaintext body,
            // };
            // const transporter = new SMTP().transporter;
            // await transporter.sendMail(mailOptions);
             
            return new Response({message :'User Registered successfully.'}).sendResponse();

        }catch(error){ 

            if(error.code == 11000 && error.errmsg.search("Phone_1 dup key")!==-1){ console.log("&&&&&");
                // return new Exception('GeneralError','Provided Email Already Exists. Please Register With Other Email.').sendError();
                return new Exception('GeneralError','Sorry! Mobile number is already exists, please try again with new mobile number.').sendError();

            }
            if(error.code == 11000 && error.errmsg.search("Email_1 dup key")!==-1){
                return new Exception('GeneralError','Provided Email Already Exists. Please Register With Other Email.').sendError();

            }
            return new Exception('GeneralError').sendError(error);
        }
    }
    /*
    URL - http://{{host}}/v1/user/register
    Method - POST
    Query Parameters - FirstName,LastName,Email,Mobile,DeviceId,Password,ReffralCode
    Request Parameters - 
    Purpose -  User SignUp
    Request- 
    Response- User Registered successfully
    */
    
    static async userSignIn(request, handler) {
        try {
            const mobile = request.payload.Mobile;
            const password = request.payload.Password;

            const  MD5 = new Hashes.MD5;
            let userResult = await User.findOne({"Mobile":mobile,"Password":MD5.hex(password)},{
                "_id":-1,
                "FirstName":1,
                "LastName":1,
                "Email":1,
                "Mobile":1,
                "Status":1
            }).lean();

           
            if(userResult){
                if(userResult.Status==false) {
                    return new Exception('GeneralError', 'You have not activated your account, please activate it').sendError();
                }else{
                    return new Response(userResult).sendResponse();
                }
            }
            else{
             return new Exception('GeneralError','Invalid Mobile or Password').sendError();
            
            
        }}catch(error){ console.log(error);
            return new Exception('GeneralError').sendError(error);
        }
    }
     /*
    URL - http://{{host}}/v1/user/signin
    Method - POST
    Query Parameters -  Mobile,Password
    Request Parameters -
    Purpose -  User SignIn
    Request- 
    Response- Return Object of User
    */
     
    static async userActivation(request, handler) {
        try {
            const token = request.payload.Token;
            if(!token){
                return new Exception('ValidationError','Please Provide Token').sendError();
            }
            const result=  await User.findOne({ $or: [ { "MobileOTP":token }, { "ActivationToken": token } ],"Status":false });
            if(!result){
                return new Exception('GeneralError','Provided Token Not Found').sendError();
            }else{
                const current = new Date().getTime();
                if(result.ExpiryDate != null && current < result.ExpiryDate){
                    await User.findOneAndUpdate({ $or: [ { "MobileOTP":token }, { "ActivationToken": token } ]}, { $set: { "Status" : true,"UpdatedAt":new Moment()}});
                    return new Response({message: 'User Activate..'}).sendResponse();
                }
                else{
                    return new Exception('GeneralError','The Token has been expired').sendError();
                }
            }

        }catch(error){
            return new Exception('GeneralError').sendError(error);
        }
    }
    /*
    URL - http://{{host}}/v1/user/activation
    Method - POST
    Query Parameters - MobileOTP/ActivationToken
    Request Parameters - 
    Purpose -  User Activation/Verification
    Request- 
    Response- Return User Activate.
    */
    
    static async forgotPassword(request, handler) {
        try {
            const result=  await User.findOne({"Email":request.params.email});
            if(!result){
                return new Exception('GeneralError','Provided Email Not Found').sendError();
            }else{

                const passwordResetToken=Utils.generateActivationToken();
                const templatesDir = path.resolve(global.ROOT_PATH, 'templates');
                const emailContent = new EmailTemplates({ views: { root: templatesDir } });
                const obj = {
                    Code: passwordResetToken,
                    Name: result.FirstName +' '+ result.LastName,
                    Link: "http://www.gogole.com?token="+passwordResetToken
                };
                const mailOptions = {
                    from: global.CONFIG['SMTP']['from'], // sender address
                    to: request.params.email, // list of receivers
                    subject: 'Password reset request', // Subject line
                    html: await emailContent.render('user/forgotPassword.ejs', obj)// plaintext body,
                };
                
                const transporter = new SMTP().transporter;
               // const data = await transporter.sendMail(mailOptions);
               transporter.sendMail(mailOptions, function(error, info){
                    if (error) {
                            console.log(error);
                    } else {
                            console.log('Email sent: ' + info.response);
                }
                });
                await User.findOneAndUpdate({"Email":request.params.email}, { $set: { "PasswordResetToken":passwordResetToken,"PasswordResetExpiryDate":new Date().getTime()+global.CONFIG['token']['expired'],"UpdatedAt":new Moment()}});
                return new Response({message: `Mail send for password reset on this mail Id- ${request.params.email}`}).sendResponse();

                // return new Response({transporter}).sendResponse();
            }
        }catch(error){
            return new Exception('GeneralError').sendError(error);
        }
    }
    /*
    URL - http://{{host}}/v1/user/{{email}}/forgotpassword
    Method - POST
    Query Parameters - 
    Request Parameters - Email
    Purpose -  User Forgot Password
    Request- Email
    Response- Return message of mail sent of your email.
    */
     
    static async changePassword(request, handler) {
        try {
            const tokenOrId = request.params.token;
            const password = request.payload.Password;
            let query ={}
            if(tokenOrId.length ==24 ){
                query= {
                    "_id": tokenOrId
                };
            }else{
                query= {
                    "PasswordResetToken": tokenOrId
                };
            }

            const result=  await User.findOne(query);

            if(!result){
                if(request.payload.OldPassword){
                    const updateResult = await User.findOneAndUpdate({"Password": MD5.hex(request.payload.OldPassword)}, { $set: { "Password":MD5.hex(request.payload.Password),"UpdatedAt":new Moment()}});
                    if(updateResult) {
                        return new Response({}).sendResponse();
                    }else{
                        return new Exception('ValidationError','Old password is invalid').sendError();
                    }
                }else{
                    return new Exception('GeneralError','Record Not Found').sendError();
                }
            }
            else{
                const current = new Date().getTime();
                if(result.PasswordResetExpiryDate != null && current < result.PasswordResetExpiryDate){
                    await User.findOneAndUpdate(query, { $set: { "Password":MD5.hex(password),"UpdatedAt":new Moment()}});
                    return new Response({messgae: 'Password change successfully!!'}).sendResponse();
                }else{

                    return new Exception('GeneralError','The token has been expired. Please reset again.').sendError();
                }

            }
        }catch(error){
            return new Exception('GeneralError').sendError();
        }
    }
    /*
    URL - http://{{host}}/v1/user/{{token}}/changepassword
    Method - PUT
    Query Parameters - Password
    Request Parameters - Token
    Purpose -  User Change Password
    Request- 
    Response- Return message of Password change successfully!!
    */
    
    static async getUserProfile(request, handler) {
        try {

            const result=  await User.findOne({"_id":request.params.id},
                {
                    "_id":1,
                    "FirstName":1,
                    "LastName":1,
                    "Email":1,
                    "Mobile":1,
                    "Status":1,
                    "CreatedAt":1,
                    "UpdatedAt":1
                    }).lean();

            result.CreatedAt= Moment(result.CreatedAt).format("DD/MM/YYYY");
            result.UpdatedAt= Moment(result.UpdatedAt).format("DD/MM/YYYY");
            if(result==null){
                return new Exception('GeneralError','Record Not Found').sendError();
            }else{
                return new Response(result).sendResponse();
            }
        }catch(error){
            return new Exception('GeneralError').sendError(error);
        }
    }
    /*
    URL - http://{{host}}/v1/user/{{UserId}}
    Method - GET
    Query Parameters - 
    Request Parameters - UserId
    Purpose -  Get Profile of perticular User
    Request- UserId
    Response- Return object of User
    */

    static async getContestTicket(request, handler) {
        try {
            const result=  await ContestUserHousey.findOne({"UserId":request.params.id, "ContestId":request.params.contestid},{
                "HouseyTicket":1,
            }).lean();
            if(result==null){
                return new Exception('GeneralError','Record Not Found').sendError();
            }else{
                return new Response(result).sendResponse();
            }
        }catch(error){
            return new Exception('GeneralError').sendError(error);
        }
    }

     /*
    URL - http://{{host}}/v1/user/{{UserId}}/contestticket/{{ContestId}}
    Method - GET
    Query Parameters - 
    Request Parameters - UserId,ContestId
    Purpose -  Get Contest Ticket of perticular User and Contest
    Request- UserId,ContestId
    Response- Return object user of ContestTicket
    */
     
    static async myTransaction(request, handler){
        try{
            const userId = request.params.id;
            const startDate = request.query.StartDate;
            const endDate = request.query.EndDate;
            const transactionType = request.query.TransactionType;
            //const myDate ='2020/02/29';
            // const inputDate = new Date(myDate).toISOString();
            // //console.log(inputDate,"*****");
            // console.log(Moment('29-02-2020', 'DD/MM/YYYY'));

            let queryObject = {};
            queryObject.UserId=userId;

            if (startDate) {


                if (!Moment(startDate, 'DD/MM/YYYY', true).isValid()) {
                    return new Exception('ValidationError', 'Start Date Must Be DD/MM/YYYY').sendError();
                }
             queryObject.CreatedAt={$gte: Moment(startDate, 'DD/MM/YYYY')}
            }
            if (endDate) {


                if (!Moment(endDate, 'DD/MM/YYYY', true).isValid()) {
                    return new Exception('ValidationError', 'End Date Must Be DD/MM/YYYY').sendError();
                }
                queryObject.CreatedAt={$lt: Moment(endDate, 'DD/MM/YYYY')}
            }

            if(startDate && endDate){
                queryObject.CreatedAt={$gte: Moment(startDate, 'DD/MM/YYYY'), $lt: Moment(endDate, 'DD/MM/YYYY')}
            }
            if(transactionType){
                queryObject.Type=transactionType;
            }
            const result = await Transaction.find(queryObject);
            return new Response(result).sendResponse();

        }catch(error){
            //return new Exception('GeneralError').sendError(error);
        }
    }
    /*
    URL - http://{{host}}/v1/user/{{UserId}}/transaction?StartDate=04/10/2020&EndDate=06/10/2020
    Method - GET
    Query Parameters - StartDate,EndDate
    Request Parameters - UserId
    Purpose -  Get transaction
    Request- UserId
    Response- Return object of Transaction
    */
    
    static async getBalance(request, handler){
        try{
            const userId = request.params.id;
            const userDetails = await User.findOne({"_id":userId}).lean();
            let responseObject={};
            responseObject.WalletAmount=parseFloat(userDetails.WalletAmount);
            responseObject.BonusAmount=parseFloat(userDetails.BonusAmount);
            responseObject.TotalBalance= parseFloat(userDetails.WalletAmount)+parseFloat(userDetails.BonusAmount);
            return new Response(responseObject).sendResponse();

        }catch(error){
            return new Exception('GeneralError').sendError(error);
        }
    }
    /*
    URL -  http://{{host}}/v1/user/{{UserId}}/getbalance
    Method - GET
    Query Parameters -
    Request Parameters - UserId
    Purpose -  Get Balance
    Request- UserId
    Response- Return object of Balance
    */
    
    static async createOrder(request, handler){
        try{
            const userId = request.params.id;
            var options = {
                amount: 100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: "order_"+userId,
                payment_capture: 1
            };
            const result = await instance.orders.create(options);

            // const orderDetails = await instance.orders.fetch(result.id);
            let postData={};
            postData.UserId=userId;
            postData.OrderId=result.id;
            postData.Entity=result.entity;
            postData.Amount=result.amount;
            postData.Currency=result.currency;
            postData.Status=result.status;
            postData.CreatedAt=result.created_at;
            const orderObj = new Order(postData);
            await orderObj.save();

            return new Response(postData).sendResponse();
        }catch(error){
            return new Exception('GeneralError').sendError(error);
        }
    }
    /*
    URL -  http://{{host}}/v1/user/{{UserId}}/createorder
    Method - POST
    Query Parameters -
    Request Parameters - UserId
    Purpose -  Create order
    Request- UserId
    Response- Return object of Order
    */
    static  async getPaymentDetails(request, handler){
        try{
            const userId = request.params.id;
            const paymentId = request.payload.PaymentId;
            console.log(paymentId);
            const result = await instance.payments.fetch('pay_EORvcwzOrPhb4t');
            console.log(result);
            let postData={};
            postData.PaymentId=result.id;
            postData.Entity=result.entity;
            postData.Amount=result.amount;
            postData.Currency=result.currency;
            postData.Status=result.status;
            postData.OrderId=result.order_id;
            postData.InvoiceId=result.invoice_id;
            postData.International=result.international;
            postData.Method=result.method;
            postData.AmountRefunded=result.amount_refunded;
            postData.RefundStatus=result.refund_status;
            postData.Captured=result.captured;
            postData.Description=result.description;
            postData.CardId=result.card_id;
            postData.Bank=result.bank;
            postData.Wallet=result.wallet;
            postData.Vpa=result.vpa;
            postData.Email=result.email;
            postData.Contact=result.contact;
            postData.Notes=result.notes;
            postData.Fee=result.fee;
            postData.Tax=result.tax;
            postData.ErrorCode=result.error_code;
            postData.ErrorDescription=result.error_description;
            postData.CreatedAt=result.created_at;
            const orderObj = new Payment(postData);
            await orderObj.save();


            if(result.status=='captured'){

                const order = await Order.findOne({"OrderId":result.order_id}).lean();

                if(order){
                    const user = await User.findOne({"_id":order.UserId}).lean();
                    await User.findOne({"_id":order.UserId});
                    await User.findOneAndUpdate({"_id":order.UserId}, { $set: { "WalletAmount": parseFloat(user.WalletAmount) + parseFloat(result.amount/100)}});

                    const postData = {};
                    postData.UserId =order.UserId;
                    postData.Description ='Add Amount';
                    postData.Type= 1; //0=Bonus Amount,1=Add Amount In to Wallet 2= Amount Withdrawn from  Wallet
                    postData.Amount =parseFloat(result.amount/100);
                    postData.CreatedAt = new Moment();
                    const transactionObj = new Transaction(postData);
                    await transactionObj.save();

                }

            }

            return new Response(postData).sendResponse();
        }catch(error){
            return new Exception('GeneralError').sendError(error);
        }
    }
    static escapeRegExp(str) {
        //escapeRegExp("All of these should be escaped: \ ^ $ * + ? . ( ) | { } [ ]");
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }
}
module.exports = UserController;
