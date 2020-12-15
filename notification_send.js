'use strict';
const User = require('./api/models/user');
const Notification = require('./api/models/notification');
const ENV = process.env.NODE_ENV || 'develop';
const configFile = './config/environments/' + ENV + '.json';
global.CONFIG = require(configFile);
const pushNotification = global.CONFIG.push_notification;
global.ROOT_PATH = __dirname;
global.EXCEPTIONS = require('./config/exceptions');
const Mongo = require('./config/mongodb').Mongo;
const FCM = require('fcm-node');
const Moment = require('moment');
const Contest = require('./api/models/contest');
const UsersContest = require('./api/models/users_contest');

/*
Purpose -  Send Notification to User
Usage - Found difference between 30 minute of contest startTime and current time than send notification to user 
        for eg. you are join in this contest  
*/
const SendNotification = async () => {

            const fcm = new FCM(pushNotification.serverkey);
            const contests = await Contest.find({IsRunning: false, IsCompleted :false}).lean(); 
            for(let i=0;i< contests.length;i++){
              
                    const now = Moment();
                    const startDate = Moment.unix(contests[i].StartDate);
                    const difference = startDate.diff(now,'minutes');
                    console.log(difference,'..........................difference');
                    if(difference === 30){
                    const usersContest = await UsersContest.find({ContestId:contests[i]._id}).lean();
                    for(let j=0;j<usersContest.length;j++){
                    const userId = usersContest[j].UserId;
                    const users = await User.findById({_id:userId}).populate('users');
                    const message = { 
                        to: users.DeviceId,
                         collapse_key: 'Green',
                        };
                    await fcm.send(message,(err,response)=> {
                        if(err){
                            console.log(err);
                            console.log('Something has gone wrong! ')
                            const contestNotificationFailure = {
                                Title:  'You are join in this contest', 
                                Body: 'You are join in this contest so lets ready to join in this contest after 30 minute ',
                                SendStatus: false,
                                SendTime: Moment(),
                                UserId: usersContest[j].UserId,
                                ContestId: usersContest[j].ContestId,
                                DeviceId: users.DeviceId
                            };
                            const sendNotificationUser  = new Notification(contestNotificationFailure);
                            sendNotificationUser.save();
                        }else{
                         console.log("Successfully sent with response",response);
                         const contestNotificationSuccess = {
                                Title: 'You are join in this contest', 
                                Body: 'You are join in this contest so lets ready to join in this contest after 30 minute ',
                                SendStatus: true,
                                SendTime: Moment(),
                                UserId: usersContest[j].UserId,
                                ContestId: usersContest[j].ContestId,
                                DeviceId: users.DeviceId
                                };
                        const sendNotificationUser  = new Notification(contestNotificationSuccess);
                        sendNotificationUser.save();
                        }
                        });
                    }
                    }else{
                            console.log('Not found 30 minute difference between CurrentTime and StartTime');
                    }
                }

};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

SendNotification().then( console.log('Job Started'))
    .catch(err => {

        console.error(err);
        // process.exit(1);
    });