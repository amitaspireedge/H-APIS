const Sample = require('../models/sample');
const Exception = require('../../lib/exception');
const Response = require('../../lib/response');
const validator = require('validator');
const Contest = require('../models/contest');
const UsersContest = require('../models/users_contest');
const Moment = require('moment');
const Tambola = require('tambola-generator');
const ContestUserHousey = require('../models/contest_user_housey');
const ContestHouseyNumber = require('../models/contest_housey_numers');
const ContestWinner= require('../models/contest_winners');
const User = require('../models/user');
const Transaction = require('../models/transaction');

const {
    setIntervalAsync,
    clearIntervalAsync
} = require('set-interval-async/dynamic');
class ContestController {
    
    static async createContest(request, handler) {
        try {
            const userId = request.params.id;
            const contestName = request.payload.ContestName;
            const ticketPrice = request.payload.TicketPrice;
            const startTime = request.payload.StartTime;
            const endTime = request.payload.EndTime;
            const maxPlayers = request.payload.MaxPlayers;
            const numberGenerateAuto = request.payload.NumberGenerateAuto;
            const numberGenerateDuration = request.payload.NumberGenerateDuration;
            const rules = request.payload.Rules;

            if(!contestName){
                return new Exception('ValidationError','Please Provide Contest Name').sendError();
            }
            if(!ticketPrice){
                return new Exception('ValidationError','Please Provide Ticket Price').sendError();
            }else{
                if (!validator.isNumeric(ticketPrice.toString())) {
                    return new Exception('ValidationError','Please Provide Numeric Value For Ticket Price').sendError();
                }
            }

            if(numberGenerateAuto!=true  && numberGenerateAuto!=false){
                return new Exception('ValidationError','Please Provide Auto').sendError();
            }else{
                if(!validator.isBoolean(numberGenerateAuto.toString())){
                    return new Exception('ValidationError','Please Provide Boolean Value').sendError();
                }
            }
            if(numberGenerateAuto ==true){
                if(!startTime){
                    return new Exception('ValidationError','Please Provide Contest Start Time').sendError();
                }
                // if(!endTime){
                //     return new Exception('ValidationError','Please Provide Contest End Time').sendError();
                // }
                if(!numberGenerateDuration){
                    return new Exception('ValidationError','Please Provide Number Generate Duration').sendError();
                }else{
                    if (!validator.isNumeric(numberGenerateDuration.toString())) {
                        return new Exception('ValidationError','Please Provide Numeric Value For Number Generate Duration').sendError();
                    }
                }
            }

            if(!maxPlayers){
                return new Exception('ValidationError','Please Provide Max Players').sendError();
            }else{
                if (!validator.isNumeric(maxPlayers.toString())) {
                    return new Exception('ValidationError','Please Provide Numeric Value For Max Players').sendError();
                }
            }
            if(!rules){
                return new Exception('ValidationError','Please Provide Rules').sendError();
            }
            if(rules && rules.length==0){
                return new Exception('ValidationError','Please Provide Rules').sendError();
            }
            let inputValid = true;
            let invalidParams = '';
            for(let i=0; i<rules.length;i++){
                 if (!rules[i].RuleId) {
                    inputValid = false;
                    invalidParams += 'Rules[' + i + '].RuleId,';
                }
                if (!rules[i].Price) {
                    inputValid = false;
                    invalidParams += 'Rules[' + i + '].Price,';
                }else{
                    if (!validator.isNumeric(rules[i].Price.toString())) {
                        return new Exception('ValidationError','Please Provide Numeric Value For '+'Rules[' + i + '].Price').sendError();
                    }
                }
                if (!rules[i].Quantity) {
                    inputValid = false;
                    invalidParams += 'Rules[' + i + '].Quantity,';
                }else{
                    if (!validator.isNumeric(rules[i].Quantity.toString())) {
                        return new Exception('ValidationError','Please Provide Numeric Value For '+'Rules[' + i + '].Quantity').sendError();
                    }
                }
            }
            if (!inputValid) {
                return new Exception('ValidationError',"Please Provide "+invalidParams.replace(/,\s*$/, '')).sendError();
            }

            let valueArr = rules.map(function(item){ return item.RuleId });
            const isDuplicate = valueArr.some(function(item, idx){
                return valueArr.indexOf(item) != idx
            });

            if (isDuplicate) {
                return new Exception('ValidationError',"You can not apply same rule more than one time").sendError();
            }

            const postData = {};
            postData.ContestName=contestName;
            postData.TicketPrice=ticketPrice;
            postData.MaxPlayers=maxPlayers;
            postData.CreatedBy=userId;
            postData.IsRunning = false;
            postData.EndDate=Moment(endTime,'DD/MM/YYYY hh:mm:ss A',true).unix();
            postData.NumberGenerateAuto=numberGenerateAuto;
            postData.NumberGenerateDuration =numberGenerateDuration;
            postData.TotalAmount=(maxPlayers*ticketPrice)
            postData.HtgUsageAmount= (maxPlayers*10);//HTG Changes for per users
            postData.CreatedAt = new Moment();
            postData.IsCompleted=false;
            if(numberGenerateAuto ==true){
                postData.StartDate = Moment(startTime,'DD/MM/YYYY hh:mm:ss A',true).unix();
                //'17/06/1983 07:30:00 PM', 'DD/MM/YYYY hh:mm:ss A'
            }else{
                postData.StartDate = Moment(startTime,'DD/MM/YYYY hh:mm:ss A',true).unix();
            }

            const contestObj = new Contest(postData);
            const result= await contestObj.save();

            const contestId=result._id;
            let dataObject={};
            dataObject.ContestId=contestId;
            dataObject.Number=[];
            dataObject.ArrayForCompare=[];
            dataObject.DefaultNumber=global.CONFIG['default']['number'];

           const contestHouseyNumberObj = new ContestHouseyNumber(dataObject);
            const resultContestHouseyNumber= await contestHouseyNumberObj.save();


            for(let i=0; i<rules.length;i++){
                const object = {
                    ContestId: contestId,
                    RuleId :rules[i].RuleId,
                    Price: rules[i].Price,
                    Quantity:rules[i].Quantity,
                    RemainingQuantity: rules[i].Quantity

                }
                await Contest.update({_id:contestId},  { $push: { ContestRules: object } });
            }
            const responeobject = await Contest.findById({_id:contestId}).lean();
            return new Response(responeobject).sendResponse();

        }catch(error){
            if(error.code == 11000 && error.errmsg.search("ContestName_1 dup key")!==-1){
                // return new Exception('GeneralError','Provided Email Already Exists. Please Register With Other Email.').sendError();
                return new Exception('GeneralError','Sorry! Contest Name is already exists, please try again with new Contest Name.').sendError();

            }
            return new Exception('GeneralError').sendError(error);
        }
    }
    /*
    URL -  http://{{host}}/v1/user/{{UserId}}/createcontest
    Method - POST
    Query Parameters - ContestName,TicketPrice,StartTime,EndTime,MaxPlayers,NumberGenerateAuto,NumberGenerateDuration,Rules
    Request Parameters - UserId
    Purpose -  Create Contest for User
    Request- UserId
    Response- Return object of Contest
    */
    
    static async getContest(request, handler) {
        try {

            // const contests = await Contest.find({ StartDate: { $gte: Moment().unix() } },{
            //     "_id":1,
            //     "ContestName":1,
            //     "TicketPrice":1,
            //     "MaxPlayers":1,
            //     "NumberGenerateAuto":1,
            //     "StartDate":1
            // }).sort({"StartDate":1}).lean();

            // for(let i=0;i<contests.length;i++){

            //     contests[i].StartDate= Moment.unix(contests[i].StartDate).format('DD/MM/YYYY hh:mm:ss A');

            // }

            const contests = await Contest.find({ "NumberGenerateAuto": true },{
                "_id":1,
                "ContestName":1,
                "TicketPrice":1,
                "MaxPlayers":1,
                "NumberGenerateAuto":1,
                "StartDate":1
            }).lean();

            const manualContests = await Contest.find({ "NumberGenerateAuto": false },{
                "_id":1,
                "ContestName":1,
                "TicketPrice":1,
                "MaxPlayers":1,
                "NumberGenerateAuto":1,
                "StartDate":1
            }).lean();
            let responseObject ={
                'Auto':contests,
                'Manual':manualContests
            };

            return new Response(responseObject).sendResponse();

        }catch(error){
            return new Exception('GeneralError').sendError(error);
        }
    }
    /*
    URL - http://{{host}}/v1/contest
    Method - GET
    Query Parameters - 
    Request Parameters - 
    Purpose -  Get Contest
    Request- 
    Response- Return array of AutoContest and ManualContest
    */
    
    static async getContestDetails(request, handler) {
        try {
             const contestId = request.params.contestid;
             const responseObject = await Contest.findOne({_id:contestId},{
                "_id":1,
                "ContestName":1,
                "TicketPrice":1,
                "MaxPlayers":1,
                "NumberGenerateAuto":1,
                "StartDate":1,
                "EndDate":1,
                "CreatedBy":1,
                "NumberGenerateDuration":1,
                "IsRunning":1, 
                "IsCompleted":1,
                "TotalAmount":1,
                "HtgUsageAmount":1,
                "ContestRules":1,
             }).lean();

            return new Response(responseObject).sendResponse();
            
        }catch(error){
            return new Exception('GeneralError').sendError(error);
        }
    }
    /*
    URL - http://{{host}}/v1/contest/{{ContestId}}/details
    Method - GET
    Query Parameters - 
    Request Parameters - ContestId
    Purpose -  Get Contest Details By ContestId
    Request- ContestId
    Response- Return object of Contest
    */
    
    static async joinContest(request, handler){

        try{
            const userId = request.payload.UserId;
            const contestId = request.payload.ContestId;
            if(!userId){
                return new Exception('ValidationError','Please Provide UserId').sendError();
            }
            if(!contestId){
                return new Exception('ValidationError','Please Provide Contest Id').sendError();
            }

            const userDetails =  await User.find({ "_id":userId  });
            const totalBalance = parseFloat(userDetails[0].BonusAmount) + parseFloat(userDetails[0].WalletAmount);
            if(totalBalance == 0 || totalBalance <=0){
                return new Exception('ValidationError','Please check your balance').sendError();
            }
            const contestDetails =  await Contest.find({ "_id":contestId  });
            if(contestDetails.TicketPrice > totalBalance ){
                return new Exception('ValidationError','You have insufficient balance').sendError();
            }

            const ticket=Tambola.getTickets(1);
            const contestUserHouseyPostObject = {};
            contestUserHouseyPostObject.UserId=userId;
            contestUserHouseyPostObject.ContestId=contestId;
            contestUserHouseyPostObject.HouseyTicket=ticket[0];


            const contestUserHouseyObj = new ContestUserHousey(contestUserHouseyPostObject);
             await contestUserHouseyObj.save();

             if(parseFloat(userDetails.BonusAmount) > 0){
                 if(parseFloat(userDetails[0].BonusAmount)-parseFloat(contestDetails[0].TicketPrice) >=0) {
                     await User.findOneAndUpdate({"_id": userId}, {$set: {"BonusAmount": parseFloat(userDetails[0].BonusAmount) - parseFloat(contestDetails[0].TicketPrice)}});
                     const postData = {};
                     postData.UserId = userId;
                     postData.Description = 'Purcahse Ticket with the Price amount ' + contestDetails[0].TicketPrice;
                     postData.Type = 3; //0=Bonus Amount,1=Add Amount In to Wallet 2= Amount Withdrawn from  Wallet
                     postData.Amount = parseFloat(contestDetails[0].TicketPrice);
                     postData.CreatedAt = new Moment();
                     const transactionObj = new Transaction(postData);
                     await transactionObj.save();
                 }else{
                     const diffAmount =parseFloat(contestDetails[0].TicketPrice) - parseFloat(userDetails[0].BonusAmount);
                     await User.findOneAndUpdate({"_id": userId}, {$set: {"BonusAmount": 0,"WalletAmount": parseFloat(userDetails[0].WalletAmount) - diffAmount}});
                     const postData = {};
                     postData.UserId = userId;
                     postData.Description = 'Purcahse Ticket with the Price amount ' + contestDetails[0].TicketPrice;
                     postData.Type = 3; //0=Bonus Amount,1=Add Amount In to Wallet 2= Amount Withdrawn from  Wallet
                     postData.Amount = parseFloat(contestDetails[0].TicketPrice);
                     postData.CreatedAt = new Moment();
                     const transactionObj = new Transaction(postData);
                     await transactionObj.save();
                 }

             }else{
                 await User.findOneAndUpdate({"_id": userId}, {$set: {"WalletAmount": parseFloat(userDetails[0].WalletAmount) - parseFloat(contestDetails[0].TicketPrice)}});
                 const postData = {};
                 postData.UserId = userId;
                 postData.Description = 'Purcahse Ticket with the Price amount ' + contestDetails[0].TicketPrice;
                 postData.Type = 3; //0=Bonus Amount,1=Add Amount In to Wallet 2= Amount Withdrawn from  Wallet
                 postData.Amount = parseFloat(contestDetails[0].TicketPrice);
                 postData.CreatedAt = new Moment();
                 const transactionObj = new Transaction(postData);

                 await transactionObj.save();
             }


            const userContests = await UsersContest.findOne({ "UserId": userId,"ContestId": contestId}).lean();
            if(userContests){
                return new Exception('ValidationError','You already join this contest').sendError();
            }else{
            const postData = {};
            postData.UserId=userId;
            postData.ContestId=contestId;
            postData.IsContestActive=false;
            postData.IsContestRunning=false;
            postData.CreatedAt=Moment().unix();
            const Obj = new UsersContest(postData);
            const result= await Obj.save();
            return new Response({message:'You are join this contest successfully'}).sendResponse();
            }
           
        }catch (e) {
            return new Exception('GeneralError').sendError(e);
        }
    }
    /*
    URL - http://{{host}}/v1/contest/join
    Method - POST
    Query Parameters - UserId,ContestId,RuleId
    Request Parameters - 
    Purpose - Join Contest
    Request- 
    Response- Return message of You are join this contest successfully
    */

    // static async getContestNumber(request, handler){
    //     try{
    //         const contestid = request.params.contestid;
    //         const result = await ContestHouseyNumber.findOne({"ContestId":contestid}).lean();
    //         if(result){
    //              return new Response({"Number":result.Number.slice(-1).pop()}).sendResponse();
    //         }else{
    //             return new Response({result}).sendResponse();
    //         }

    //     }catch(error){
    //         return new Exception('GeneralError').sendError(error);
    //     }
    // }

    
    static async generateContestNumber(request, handler){
        try{
            const contestid = request.params.contestid;
            const contest = await Contest.findOne({"_id":contestid,"IsRunning":true,"IsCompleted":false,"NumberGenerateAuto":false}).lean();
               if(!contest){
                   return new Exception('ValidationError','Contest is not running or maybe Auto Generate ').sendError();
               }
            const result = await ContestHouseyNumber.findOne({"ContestId":contestid}).lean();
            const currentTime=Moment().unix();
            if(result){

                if(result.DefaultNumber.length> 0){
                    let htgNumber = result.DefaultNumber[Math.floor(Math.random()*result.DefaultNumber.length)];

                    const object={
                        "Number":htgNumber,
                        "Time":currentTime
                    };

                    //object[htgNumber]=currentTime;
                    const index = result.DefaultNumber.indexOf(htgNumber);
                    if (index > -1) {
                        result.DefaultNumber.splice(index, 1);
                    }


                    await ContestHouseyNumber.update({"ContestId":contestid},  { $push: { Number: htgNumber ,ArrayForCompare:object} });
                    await ContestHouseyNumber.findOneAndUpdate({"ContestId":contestid}, {$set: {Time:Moment().unix() ,DefaultNumber:result.DefaultNumber}});
                    return new Response(object).sendResponse();
                }


                // let numberArray = result.Number;
                //     const r = Math.floor(Math.random()*100) + 1;
                //     if(numberArray.indexOf(r) === -1) numberArray.push(r);
                //     await ContestHouseyNumber.findOneAndUpdate({"ContestId":contestid},  { $set: { Number: numberArray } });

            }else{
                return new Response({}).sendResponse();
            }



        }catch(error){
            return new Exception('GeneralError').sendError(error);
        }
    }
    /*
    URL - http://{{host}}/v1/contest/{{ContestId}}/number
    Method - POST
    Query Parameters -
    Request Parameters - ContestId
    Purpose - Generate Contest Number
    Request- ContestId
    Response- Return object of ContestNumber and Time
    */
    
    static async startContest(request, handler){
        try{
            const contestid = request.params.contestid;
            //,"IsRunning":false,"IsCompleted":false,"NumberGenerateAuto":false
            const contest = await Contest.findOne({"_id":contestid}).lean();

            if(contest.NumberGenerateAuto == true){
                return new Exception('ValidationError','Contest Auto Generated').sendError();
            }

            if(contest.IsRunning == true){
                return new Exception('ValidationError','Contest already running').sendError();
            }else{
                await Contest.findOneAndUpdate({"_id": contestid}, {$set: {IsRunning: true}});
                return new Response({message:'Contest started successfully'}).sendResponse();
            }

        }catch(error){
            console.log(error,"+++++");
            return new Exception('GeneralError').sendError(error);
        }
    }
    /*
    URL - http://{{host}}/v1/contest/{{ContestId}}/startcontest
    Method - PUT
    Query Parameters -
    Request Parameters - ContestId
    Purpose - Start Contest 
    Request- ContestId
    Response- Return message of Contest started successfully
    */

    // static async testFirst(contestid,Duration){
    //     try {
    //         let timer = '';
    //         timer =setIntervalAsync(
    //             async () => {
    //                 const result = await ContestHouseyNumber.findOne({"ContestId":contestid}).lean();

    //                 if(result){
    //                     if(result.Number.length<=5) {
    //                         let numberArray = result.Number;
    //                         const r = Math.floor(Math.random() * 100) + 1;
    //                         if (numberArray.indexOf(r) === -1) {
    //                             numberArray.push(r);
    //                         }else{

    //                         }
    //                         await ContestHouseyNumber.findOneAndUpdate({"ContestId": contestid}, {$set: {Number: numberArray}});
    //                     }else{
    //                         console.log('else', timer);
    //                         await clearIntervalAsync(timer);
    //                     }

    //                 }
    //             },
    //             (Duration*1000)
    //         )
    //         // await clearIntervalAsync(timer);


    //     }catch(error){ console.log(error,"!!!!!");
    //     //return new Exception('GeneralError').sendError(error);
    //      }
    // }

    
    static async contestClaim(request, handler){
        try{
            const userId = request.payload.UserId;
            const contestId = request.payload.ContestId;
            const ruleId = request.payload.RuleId;

            if(!userId){
                return new Exception('ValidationError','Please Provide User Id').sendError();
            }
            if(!contestId){
                return new Exception('ValidationError','Please Provide Contest Id').sendError();
            }
            if(!ruleId){
                return new Exception('ValidationError','Please Provide Rule Id').sendError();
            }
            const contestDetails = await Contest.findOne({ "_id": contestId });
            if(contestDetails.IsCompleted==true){
                return new Exception('ValidationError','Provided Contest already completed').sendError();
            }

            let ruleObj = contestDetails.ContestRules.find(obj => obj.RuleId == ruleId);
            if(!ruleObj){
                return new Exception('ValidationError','Wrong Claim for this Contest').sendError();
            }

            let contestUserHousey = await  ContestUserHousey.findOne({"UserId":userId,"ContestId":contestId});
            const result = await ContestHouseyNumber.findOne({"ContestId":contestId}).lean();
            let RuleCode='FIRSTROW';
            switch (RuleCode) {
                case 'FIRSTROW':
                    var firstrow = contestUserHousey.HouseyTicket[0].filter(function (value, index, arr) {
                        return value > 0;
                    });
                    if (firstrow.includes(result.ArrayForCompare[result.ArrayForCompare.length - 1]) == false) {
                        // return new Exception('ValidationError','Last generated number not found in your first row').sendError();
                    }
                    let firstRowArray = [];
                    for (let i = 0; i < firstrow.length; i++) {

                        let obj = result.ArrayForCompare.find(obj => obj.Number == firstrow[i]);
                        if (obj) {
                            const newObject = {
                                "Number": firstrow[i],
                                "Status": true
                            };
                            firstRowArray.push(newObject);
                        } else {
                            const newObject = {
                                "Number": firstrow[i],
                                "Status": false
                            };
                            firstRowArray.push(newObject);
                        }
                    }

                    let objforFirstRow = firstRowArray.find(obj => obj.Status == false);
                    if (!objforFirstRow) {
                        return new Exception('ValidationError', 'Sorry, Your claim is not valid because your first row is not completed').sendError();
                    } else {
                        let contestWinnerObject = await ContestWinner.findOne({
                            ContestId: contestId,
                            RuleId: ruleId
                        }).lean();
                        let object = {
                            "UserId": userId,
                            "Result": firstRowArray
                        }

                        if (contestWinnerObject) {

                            let Obj = contestWinnerObject.Winnerusers.find(obj => obj.UserId == userId);

                            if(Obj){
                                return new Exception('ValidationError', 'You already claim for this rules').sendError();
                            }else{
                                await ContestWinner.findOneAndUpdate({
                                    ContestId: contestId,
                                    RuleId: ruleId
                                }, {
                                    $push: {
                                        Winnerusers: object
                                    }
                                });
                            }

                        } else {

                            let data = {};
                            data.ContestId = contestId;
                            data.RuleId = ruleId;
                            data.Winnerusers = [object];
                            const Obj = new ContestWinner(data);
                            await Obj.save();

                        }
                        await Contest.updateOne({
                            _id: contestId,
                            "ContestRules.RuleId": ruleObj.RuleId
                        }, {
                            $set: {
                                "ContestRules.$.RemainingQuantity": ruleObj.RemainingQuantity - 1
                            }
                        });

                        return new Response({message:'Claim successfully done of FirstRow !!!'}).sendResponse();
                    }

                    break;
                case 'SECONDROW':
                    console.log("SECONDROW");
                    var secondrow = contestUserHousey.HouseyTicket[1].filter(function (value, index, arr) {
                        return value > 0;
                    });

                    if (secondrow.includes(result.ArrayForCompare[result.ArrayForCompare.length - 1]) == false) {
                        // return new Exception('ValidationError','Last generated number not found in your second row').sendError();
                    }
                    let secondRowArray = [];
                    for (let i = 0; i < secondrow.length; i++) {

                        let obj = result.ArrayForCompare.find(obj => obj.Number == secondrow[i]);

                        if (obj) {
                            const newObject = {
                                "Number": secondrow[i],
                                "Status": true
                            };
                            secondRowArray.push(newObject);
                        } else {
                            const newObject = {
                                "Number": secondrow[i],
                                "Status": false
                            };
                            secondRowArray.push(newObject);
                        }
                    }

                    let obj = secondRowArray.find(obj => obj.Status == false);
                    if (!obj) {
                        return new Exception('ValidationError', 'Sorry, Your claim is not valid because your second row is not completed').sendError();
                    } else {
                        let contestWinnerObject = await ContestWinner.findOne({
                            ContestId: contestId,
                            RuleId: ruleId
                        }).lean();
                        let object = {
                            "UserId": userId,
                            "Result": secondRowArray
                        }

                        if (contestWinnerObject) {

                            let Obj = contestWinnerObject.Winnerusers.find(obj => obj.UserId == userId);

                            if(Obj){
                                return new Exception('ValidationError', 'You already claim for this rules').sendError();
                            }else{
                                await ContestWinner.findOneAndUpdate({
                                    ContestId: contestId,
                                    RuleId: ruleId
                                }, {
                                    $push: {
                                        Winnerusers: object
                                    }
                                });
                            }

                        } else {

                            let data = {};
                            data.ContestId = contestId;
                            data.RuleId = ruleId;
                            data.Winnerusers = [object];
                            const Obj = new ContestWinner(data);
                            await Obj.save();

                        }
                        await Contest.updateOne({
                            _id: contestId,
                            "ContestRules.RuleId": ruleObj.RuleId
                        }, {
                            $set: {
                                "ContestRules.$.RemainingQuantity": ruleObj.RemainingQuantity - 1
                            }
                        });

                        return new Response({message:'Claim successfully done of SecondRow !!!'}).sendResponse();
                    }
                    break;
                case 'THIRDROW':
                    console.log("THIRDROW");
                    var thirdrow = contestUserHousey.HouseyTicket[2].filter(function (value, index, arr) {
                        return value > 0;
                    });

                    if (thirdrow.includes(result.ArrayForCompare[result.ArrayForCompare.length - 1]) == false) {
                        // return new Exception('ValidationError','Last generated number not found in your second row').sendError();
                    }
                    let thirdRowArray = [];
                    for (let i = 0; i < thirdrow.length; i++) {

                        let obj = result.ArrayForCompare.find(obj => obj.Number == thirdrow[i]);

                        if (obj) {
                            const newObject = {
                                "Number": thirdrow[i],
                                "Status": true
                            };
                            thirdRowArray.push(newObject);
                        } else {
                            const newObject = {
                                "Number": thirdrow[i],
                                "Status": false
                            };
                            thirdRowArray.push(newObject);
                        }
                    }

                    let thirdRowObj = thirdRowArray.find(obj => obj.Status == false);
                    if (!thirdRowObj) {
                        return new Exception('ValidationError', 'Sorry, Your claim is not valid because your second row is not completed').sendError();
                    } else {
                        let contestWinnerObject = await ContestWinner.findOne({
                            ContestId: contestId,
                            RuleId: ruleId
                        }).lean();
                        let object = {
                            "UserId": userId,
                            "Result": thirdRowArray
                        }

                        if (contestWinnerObject) {

                            let Obj = contestWinnerObject.Winnerusers.find(obj => obj.UserId == userId);

                            if(Obj){
                                return new Exception('ValidationError', 'You already claim for this rules').sendError();
                            }else{
                                await ContestWinner.findOneAndUpdate({
                                    ContestId: contestId,
                                    RuleId: ruleId
                                }, {
                                    $push: {
                                        Winnerusers: object
                                    }
                                });
                            }

                        } else {

                            let data = {};
                            data.ContestId = contestId;
                            data.RuleId = ruleId;
                            data.Winnerusers = [object];
                            const Obj = new ContestWinner(data);
                            await Obj.save();

                        }
                        await Contest.updateOne({
                            _id: contestId,
                            "ContestRules.RuleId": ruleObj.RuleId
                        }, {
                            $set: {
                                "ContestRules.$.RemainingQuantity": ruleObj.RemainingQuantity - 1
                            }
                        });

                        return new Response({message:'Claim successfully done of ThirdRow !!!'}).sendResponse();
                    }
                    break;
                default:
                    const row1 = contestUserHousey.HouseyTicket[0].filter(function (value, index, arr) {
                        return value > 0;
                    });
                    const row2 = contestUserHousey.HouseyTicket[1].filter(function (value, index, arr) {
                        return value > 0;
                    });
                    const row3 = contestUserHousey.HouseyTicket[2].filter(function (value, index, arr) {
                        return value > 0;
                    });
                    const full = [...row1,...row2,...row3];

                    console.log()

                    if (full.includes(result.ArrayForCompare[result.ArrayForCompare.length - 1]) == false) {
                        // return new Exception('ValidationError','Last generated number not found in your second row').sendError();
                    }
                    let fullRowArray = [];
                    for (let i = 0; i < full.length; i++) {

                        let obj = result.ArrayForCompare.find(obj => obj.Number == full[i]);

                        if (obj) {
                            const newObject = {
                                "Number": full[i],
                                "Status": true
                            };
                            fullRowArray.push(newObject);
                        } else {
                            const newObject = {
                                "Number": full[i],
                                "Status": false
                            };
                            fullRowArray.push(newObject);
                        }
                    }

                    let fullRowObj = fullRowArray.find(obj => obj.Status == false);
                    if (!fullRowObj) {
                        return new Exception('ValidationError', 'Sorry, Your claim is not valid because your second row is not completed').sendError();
                    } else {
                        let contestWinnerObject = await ContestWinner.findOne({
                            ContestId: contestId,
                            RuleId: ruleId
                        }).lean();

                        let object = {
                            "UserId": userId,
                            "Result": fullRowArray
                        }

                        if (contestWinnerObject) {

                            let Obj = contestWinnerObject.Winnerusers.find(obj => obj.UserId == userId);

                            if(Obj){
                                return new Exception('ValidationError', 'You already claim for this rules').sendError();
                            }else{
                                await ContestWinner.findOneAndUpdate({
                                    ContestId: contestId,
                                    RuleId: ruleId
                                }, {
                                    $push: {
                                        Winnerusers: object
                                    }
                                });
                            }

                        } else {

                            let data = {};
                            data.ContestId = contestId;
                            data.RuleId = ruleId;
                            data.Winnerusers = [object];
                            const Obj = new ContestWinner(data);
                            await Obj.save();

                        }
                        await Contest.updateOne({
                            _id: contestId,
                            "ContestRules.RuleId": ruleObj.RuleId
                        }, {
                            $set: {
                                "ContestRules.$.RemainingQuantity": ruleObj.RemainingQuantity - 1
                            }
                        });


                        return new Response({message:'Claim successfully done of Full Ticket!!!'}).sendResponse();
                        break;
                    }

            }


        }catch (e) { console.log(e,"***");
            return new Exception('GeneralError').sendError(e);
        }
    }
    /*
    URL - http://{{host}}/v1/contest/claim
    Method - POST
    Query Parameters - UserId,ContestId,RuleId
    Request Parameters - 
    Purpose - Contest Claim 
    Request- UserId,ContestId,RuleId
    Response- Return message of Claim successfully done of {{AnyRow/Full}} !!!
    */
    
    static async myContest(request, handler){
        try{
            const userId = request.params.id;
            const userContests = await UsersContest.find({ "UserId": userId});
            let responseObject={};
            responseObject.Recent=[];
            responseObject.Upcoming=[];
            responseObject.Completed=[];
            let result = userContests.map(object => object.ContestId);
            const contestResult = await Contest.find({ _id: { $in: result } },{
                "_id":1,
                "ContestName":1,
                "TicketPrice":1,
                "MaxPlayers":1,
                "NumberGenerateAuto":1,
                "StartDate":1,
                "EndDate":1,
                "CreatedBy":1,
                "NumberGenerateDuration":1,
                "IsRunning":1, 
                "IsCompleted":1,
                "TotalAmount":1,
                "HtgUsageAmount":1,
                "ContestRules":1,
                } );
            for(let i=0;i < contestResult.length;i++){
                
                if(contestResult[i].IsRunning === true && contestResult[i].IsCompleted === false){
                    responseObject.ReCocent.push(contestResult[i]);
                }
                if(contestResult[i].IsCompleted === true && contestResult[i].IsRunning === false){
                    responseObject.Completed.push(contestResult[i]);
                }
                if(contestResult[i].StartDate > Moment().unix() && contestResult[i].IsCompleted === false && contestResult[i].IsRunning === false){
                    responseObject.Upcoming.push(contestResult[i]);
                }
            }

            return new Response(responseObject).sendResponse();
        }catch(error){
            console.log(error);
            return new Exception('GeneralError').sendError(error);
        }
    }
    /*
    URL - http://{{host}}/v1/user/{{UserId}}/mycontest
    Method - GET
    Query Parameters -
    Request Parameters - UserId
    Purpose - Get Contest for particular User
    Request- UserId
    Response- Return object of Contest
    */


}
module.exports = ContestController;