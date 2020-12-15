const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
    Title: {type: String}, // Notification Title
    Body:{type: String}, //Details of Notification
    SendStatus: {type: Boolean}, // Send Status true or false
    SendTime:{type: Number}, // current date and time
    UserId: {type:String}, // Get UserId from User
    ContestId:{type:String}, // Get ContestId From Contest
    DeviceId:{type:String} // Get DeviceId From User
},{
    versionKey: false
});
module.exports = mongoose.model('Notification', NotificationSchema);
