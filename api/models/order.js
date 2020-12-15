const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderSchema = new Schema({
    UserId:{type: String}, // Get UserId from User 
    OrderId: {type: String}, 
    Status: {type: String},
    Entity :{type: String},//means order
    Amount:{type: String},
    Currency: {type: String},//means INR
    CreatedAt: {type: Number},



},{
    collection:'orders',
    versionKey: false
});
module.exports = mongoose.model('Order', OrderSchema);
