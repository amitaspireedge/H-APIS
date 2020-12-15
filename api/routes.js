
const sampleController = require('./controllers/samples_controller');
const userController = require('./controllers/users_controller');
const contestController = require('./controllers/contests_controller');
const ruleController = require('./controllers/rules_controller');
// const customerController = require('./controllers/customers_controller');
// const masterController = require('./controllers/masters_controller');
// const homepageController = require('./controllers/homepage_controller');
class Routes {
    constructor(server) {
        //server.route({method: 'GET', path: '/samples',options: {log: {collect: true}}, handler: (request, h) => sampleController.getSampleRecords(request, h)});
        //server.route({method: 'GET', path: '/samples', handler: (request, h) => sampleController.getSampleRecords(request, h)});

       //User Related apis
        server.route({method: 'POST', path: '/v1/user/register',handler: (request, h) => userController.userSignUp(request, h)});//User SignUp
        server.route({method: 'POST', path: '/v1/user/signin',handler: (request, h) => userController.userSignIn(request, h)});//User SignIn
        server.route({method: 'POST', path: '/v1/user/activation', handler: (request, h) => userController.userActivation(request, h)});//User Activation
        server.route({method: 'POST', path: '/v1/user/{email}/forgotpassword', handler: (request, h) => userController.forgotPassword(request, h)});//User ForgotPassword
        server.route({method: 'PUT', path: '/v1/user/{token}/changepassword', handler: (request, h) => userController.changePassword(request, h)});//User ChangePasswod
        server.route({method: 'GET', path: '/v1/user/{id}', handler: (request, h) => userController.getUserProfile(request, h)});//Get User Profile
        server.route({method: 'GET', path: '/v1/user/{id}/transaction', handler: (request, h) => userController.myTransaction(request, h)});//Get Transaction
        server.route({method: 'GET', path: '/v1/user/{id}/getbalance', handler: (request, h) => userController.getBalance(request, h)});//Get Balance
        server.route({method: 'POST', path: '/v1/user/{id}/createorder', handler: (request, h) => userController.createOrder(request, h)});//Create Order
        server.route({method: 'POST', path: '/v1/user/{id}/getpaymentdetails', handler: (request, h) => userController.getPaymentDetails(request, h)});//Get Payment Details
        server.route({method: 'GET', path: '/v1/user/{id}/contestticket/{contestid}', handler: (request, h) => userController.getContestTicket(request, h)});//Get ContestTicket
        server.route({method: 'POST', path: '/v1/user/{id}/createcontest', handler: (request, h) => contestController.createContest(request, h)});//Create Contest 
        server.route({method: 'GET', path: '/v1/user/{id}/mycontest', handler: (request, h) => contestController.myContest(request, h)});//Get Mycontest

        server.route({method: 'GET', path: '/v1/contest', handler: (request, h) => contestController.getContest(request, h)});//Get Contest 
        server.route({method: 'GET', path: '/v1/contest/{contestid}/details', handler: (request, h) => contestController.getContestDetails(request, h)});//Get Contest Details
        // server.route({method: 'GET', path: '/v1/contest/{contestid}/number', handler: (request, h) => contestController.getContestNumber(request, h)});
        server.route({method: 'POST', path: '/v1/contest/{contestid}/number', handler: (request, h) => contestController.generateContestNumber(request, h)});//Get Contest Ticket 
        server.route({method: 'PUT', path: '/v1/contest/{contestid}/startcontest', handler: (request, h) => contestController.startContest(request, h)});//Start Contest
        server.route({method: 'POST', path: '/v1/contest/join', handler: (request, h) => contestController.joinContest(request, h)});//Join Contest
        server.route({method: 'POST', path: '/v1/contest/claim', handler: (request, h) => contestController.contestClaim(request, h)});//Claim Contest

        server.route({method: 'GET', path: '/v1/rule', handler: (request, h) => ruleController.getRule(request, h)});//Get Rules
        server.route({method: 'POST', path: '/v1/rule', handler: (request, h) => ruleController.addRule(request, h)});//Add Rule

    }
}
module.exports = Routes;
