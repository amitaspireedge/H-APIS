const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RuleSchema = new Schema({
    RuleName: {type: String},
    RuleDetail: {type: String}, // RuleDatails 
    RuleCode: {type: String}, // Rules unique code
    Status : {type: Boolean , default: true},
    CreatedAt : {type: Number},//Current Date and Time
    UpdatedAt : {type: Number},//Updated Date and Time
    UpdatedById : {type: String}, // Rule updated By UserId
    UpdatedByName : {type: String} // Rule updated By User Name 

},{
    collection:'rules',
    versionKey: false
});
module.exports = mongoose.model('Rule', RuleSchema);
