const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AuthorizationSchema = new Schema({
    ApplicationUserId: {type: String},
    AccessToken: {type: String},
    ApplicationUserName: {type: String},
    ExpiryDate: {type: Date}
},{
    versionKey: false
});
module.exports = mongoose.model('Authorization', AuthorizationSchema);