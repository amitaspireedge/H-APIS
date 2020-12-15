const Exception = require('../../lib/exception');
const Response = require('../../lib/response');
const validator = require('validator');
const Rule = require('../models/rules');
class RuleController {
   
    static async getRule(request, handler) {
        try {
            const result = await Rule.find({"Status":true}).lean();
            return new Response(result).sendResponse();

        }catch(error){

            return new Exception('GeneralError').sendError(error);
        }
    }
     /*
    URL -  http://{{host}}/v1/rule
    Method - GET
    Query Parameters -
    Request Parameters - 
    Purpose -  Get Rules
    Request- 
    Response- Return object of Rule
    */
    
    static async addRule(request, handler) {
        try {
            const ruleName = request.payload.RuleName;
            const ruleDetail = request.payload.RuleDetail;
            const ruleCode = request.payload.RuleCode;
            const status = request.payload.Status;
            const updatedById = request.payload.UpdatedById;
            const updatedByName = request.payload.UpdatedByName;

            if(!ruleName){
                return new Exception('ValidationError','Please Provide RuleName').sendError();
            }
            if(!ruleDetail){
                return new Exception('ValidationError','Please Provide RuleDetail').sendError();
            }
            if(!ruleCode){
                return new Exception('ValidationError','Please Provide RuleCode').sendError();
            }
            const postObject = {};
            postObject.RuleName=ruleName;
            postObject.RuleDetail=ruleDetail;
            postObject.RuleCode=ruleCode;
            postObject.Status = status;
            postObject.UpdatedById=updatedById;
            postObject.UpdatedByName=updatedByName;

            const obj = new Rule(postObject);
            await obj.save();

            return new Response({message: 'Rule added successfully.'}).sendResponse();

        }catch(error){

            return new Exception('GeneralError').sendError(error);
        }
    }
    /*
    URL -  http://{{host}}/v1/rule
    Method - POST
    Query Parameters - RuleName,RuleDetail,RuleCode,Status,UpdatedById,UpdatedByName
    Purpose -  Add Rule
    Request- 
    Response- Return message of Rule added successfully
    */

}
module.exports = RuleController;