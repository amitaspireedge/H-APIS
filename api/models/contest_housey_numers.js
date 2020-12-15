const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ContestHouseyNumberSchema = new Schema({
    ContestId: {type: String},// Get ContestId from Contest
    Number: {type: Array},
    ArrayForCompare:{type: Array},
    Time:{type: Number},// Get current date and Time
    DefaultNumber: {type: Array}, // show Default number between 1 to 90


},{
    collection:'contest_housey_numbers',
    versionKey: false
});
module.exports = mongoose.model('ContestHouseyNumber', ContestHouseyNumberSchema);
