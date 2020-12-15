const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SampleSchema = new Schema({
    name: {type: String}
},{
    versionKey: false
});
module.exports = mongoose.model('Sample', SampleSchema);