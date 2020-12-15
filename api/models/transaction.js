const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TransactionSchema = new Schema({
    UserId: {type: String}, // Get UserId from User 
    Description: {type: String}, // transaction details
    Type:{type: Number}, //0=Bonus Amount,1=Add Amount In to Wallet 2= Amount Withdrawn from  Wallet
    TransactionId:{type: String}, 
    CreatedAt: {type: Date}, // Get Current Date and Time
    Amount:{type: Number} // Get How many amount of transaction


},{
    versionKey: false
});
module.exports = mongoose.model('Transaction', TransactionSchema);
