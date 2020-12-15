const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UsersContestSchema = new Schema({
    UserId : {type: String},
    ContestId:{type: String},
    IsContestActive :{type: Boolean, Default: false},
    IsContestRunning:{type: Boolean, Default: false},
    CreatedAt: {type: Number},



},{
    versionKey: false
});
module.exports = mongoose.model('UsersContest', UsersContestSchema);
