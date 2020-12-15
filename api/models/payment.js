const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PaymentSchema = new Schema({
    PaymentId:{type: String},
    OrderId: {type: String},
    Entity :{type: String},
    Amount :{type: String},
    Currency :{type: String},
    Status :{type: String},
    InvoiceId:{type: String},
    International : {type: Boolean, Default: false},
    Method:{type: String},
    AmountRefunded :{type: String},
    RefundStatus:{type: String},
    Captured:{type: Boolean, Default: false},
    Description:{type: String},
    CardId:{type: String},
    Bank:{type:String},
    Wallet:{type:String},
    Vpa:{type:String},
    Email:{type:String},
    Contact:{type:String},
    Notes:{type: Array},
    Fee:{type:String},
    Tax:{type:String},
    ErrorCode:{type:String},
    ErrorDescription:{type:String},
    CreatedAt: {type: Number},



},{
    collection:'payments',
    versionKey: false
});
module.exports = mongoose.model('Payment', PaymentSchema);
