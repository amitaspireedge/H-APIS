const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ContestRulesSchema = new Schema({
    ContestId: {type: String}, //Get ContestId from Contest
    RuleId :{type: String},//Get RuleId from Rule
    Price: {type: String},// contest Price 
    Quantity:{type: Number},// Contest Winner Quantity
    RemainingQuantity: {type:Number}// Contest Claimed RemainingQuantity

}, {versionKey: false});

const ContestSchema = new Schema({
    ContestName : {type: String,unique:true},
    TicketPrice:{type: Number},
    StartDate: {type: Number},
    EndDate: {type: Number},
    MaxPlayers:{type: Number},
    CreatedBy: {type: String}, // Created By UserId
    NumberGenerateAuto :{type: Boolean, Default: false},
    NumberGenerateDuration : {type: Number}, // How many number generate in one contest
    IsRunning: {type: Boolean, Default: false},
    IsCompleted: {type: Boolean, Default: false},
    TotalAmount:{type: Number}, //HTG Changes for per users
    HtgUsageAmount : {type: Number},
    ContestRules:[ContestRulesSchema], // Get Array of ContestRules
    CreatedAt: {type: Date}, //Get Current date and Time
    UpdatedAt: {type: Date} // Get Updated date and Time


},{
    versionKey: false
});
module.exports = mongoose.model('Contest', ContestSchema);
