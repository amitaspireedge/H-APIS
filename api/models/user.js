const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    FirstName: {type: String},
    LastName : {type: String},
    Email : {type: String,unique:true}, 
    Mobile :{type: String,unique:true},
    DeviceId:{type: String},//Get DeviceId By mobile device
    Password : {type : String},
    Status: {type: Boolean, Default: true},//Get User Status check for User Active or not 
    CreatedAt: {type: Date},//Get Current Date and Time
    UpdatedAt: {type: Date},//Get Upddated Date and Time
    MobileOTP : {type: String},
    ActivationToken: {type: String},// ActivationToken for verification
    ExpiryDate: {type : Number}, // ExpiryDate for User Diactive
    PasswordResetToken :{type : String}, // PasswordReset token for change password
    PasswordResetExpiryDate: {type: Number},
    SMSResponse:{type: JSON},  // SMS response for verification
    ReffralCode:{type: String}, // ReffralCode for registar
    WalletAmount:{type: Number}, 
    BonusAmount:{type: Number}


},{
    versionKey: false
});

module.exports = mongoose.model('User', UserSchema);
