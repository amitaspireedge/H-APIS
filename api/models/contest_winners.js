const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ContestWinnersSchema = new Schema({
    ContestId:{type: String}, // Get ContestId from Contest
    RuleId:{type: String}, // Get RuleId from Rule
    Winnerusers: {type: Array} // show Winner User



},{
    versionKey: false
});
module.exports = mongoose.model('ContestWinners', ContestWinnersSchema);
