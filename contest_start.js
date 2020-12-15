'use strict';

const Hapi = require('hapi');
const ENV = process.env.NODE_ENV || 'develop';
const configFile = './config/environments/' + ENV + '.json';
const AuthBearer = require('hapi-auth-bearer-token');
global.CONFIG = require(configFile);
global.ROOT_PATH = __dirname;
global.EXCEPTIONS = require('./config/exceptions');
const Mongo = require('./config/mongodb').Mongo;
const Contest = require('./api/models/contest');
const ContestHouseyNumber = require('./api/models/contest_housey_numers');
const UserContest = require('./api/models/users_contest');
const ContestController = require('./api/controllers/contests_controller');
const Moment = require('moment');
/*
Purpose -  Status change IsRunning and IsCompleted of Contest 
Usage - If Contest start now than status change IsRunning=true
        If Contest complete now than status change IsCompleted=true
        This job running every minute in background
*/
const Start = async () => { 
    // console.log(Moment().unix(),"****"); //StartDate: { $lte: Moment().unix() },"IsCompleted":false,"IsRunning":false
    const contests = await Contest.find({}).lean(); //,"IsRunning":false

    for(let i=0;i< contests.length;i++){

         // console.log(Moment.unix(contests[i].StartDate).format('DD/MM/YYYY hh:mm:ss A'),"-----",contests[i].NumberGenerateDuration);
        // ContestController.testFirst(contests[i]._id,contests[i].NumberGenerateDuration);
        for (let j=0;j<contests[i].ContestRules.length;j++){
        if(contests[i].StartDate === Moment().unix()){
            await Contest.findOneAndUpdate({"_id":contests[i]._id},  { $set: { IsRunning: true } });
        }
            // console.log(contests[i].ContestRules[j].RemainingQuantity === 0);
        if(contests[i].EndDate < Moment().unix()|| contests[i].ContestRules[j].RemainingQuantity === 0){
         await Contest.findOneAndUpdate({"_id":contests[i]._id},  { $set: { IsCompleted: true }});
        }
        }
 
        // await ContestHouseyNumber.findOneAndUpdate({"ContestId":contests[i]._id}, {$set: {Time:Moment().unix() }});

        // await UserContest.findOneAndUpdate({"ContestId":contests[i]._id},  { $set: { IsContestRunning: true,IsContestActive:true } });
    }
    // process.exit(1);

};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

Start().then( console.log('Job Started'))
    .catch(err => {

        console.error(err);
        // process.exit(1);
    });