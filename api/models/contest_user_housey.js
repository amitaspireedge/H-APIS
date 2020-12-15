const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ContestUserHouseySchema = new Schema({
    UserId : {type: String}, // Get UserId from  User
    ContestId:{type: String},// Get ContestId from Contest
    HouseyTicket :{type: Schema.Types.Mixed} // Get Contest Ticket

},{
    versionKey: false
});
module.exports = mongoose.model('ContestUserHousey', ContestUserHouseySchema);
