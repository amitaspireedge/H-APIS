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


const Start = async () => {

    const contests = await Contest.find({"IsRunning":true,"IsCompleted":false}).lean(); //,"IsRunning":false

    for(let i=0;i< contests.length;i++){

        const contest= await ContestHouseyNumber.findOne({"ContestId":contests[i]._id});
        const currentTime=Moment().unix();

        if((currentTime-contest.Time) >contests[i].NumberGenerateDuration){
            console.log('if',contest.DefaultNumber.length);
            if(contest.DefaultNumber.length> 0){
                let htgNumber = contest.DefaultNumber[Math.floor(Math.random()*contest.DefaultNumber.length)];

                const object={
                    "Number":htgNumber,
                    "Time":currentTime
                };

                //object[htgNumber]=currentTime;
                console.log(object);
                const index = contest.DefaultNumber.indexOf(htgNumber);
                if (index > -1) {
                    contest.DefaultNumber.splice(index, 1);
                }

                console.log(contest.DefaultNumber);
                await ContestHouseyNumber.update({"ContestId":contests[i]._id},  { $push: { Number: htgNumber ,ArrayForCompare:object} });
                await ContestHouseyNumber.findOneAndUpdate({"ContestId":contests[i]._id}, {$set: {Time:Moment().unix() ,DefaultNumber:contest.DefaultNumber}});

            }
        }else{
            console.log('else');
    }
    process.exit(1);

};

Start().then( console.log('Job Started'))
    .catch(err => {

        console.error(err);
        process.exit(1);
    });

