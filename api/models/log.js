const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LogSchema = new Schema({
    Api: {type: String},
    Method: {type: String},
    InputParameters: {type: Schema.Types.Mixed},
    ApplicationUser: {type: String},
    User: {type: String},
    Type: {type: String},
    OutPut: {type: Schema.Types.Mixed},
    logDt: {type: String},
    StartTime: {type: String},
    ResponseTime: {type: String},
    ApiHash: {type: String},
    uuid: {type: String},
    ResponseSize: {type: String}
},{
    versionKey: false
});
module.exports = mongoose.model('Log', LogSchema);