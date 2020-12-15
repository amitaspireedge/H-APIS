const schema = require('../model/user.schema');
 
const validator = async(req,res, next) => { 
	const {err} = schema.validate(req.body,{abortEarly:false});
	if(err) return res.status(400).json({err});
	next();
}

module.exports = validator;