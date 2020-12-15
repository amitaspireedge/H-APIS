const Request = require('request-promise');

class SMSApi {
    constructor(request) {
        this.request = request;

        //this.hostname = 'http://control.msg91.com';
    }

    async sendOTP(message,mobile,otp) {
        const path = '/api/sendotp.php?message=' + message + '&authkey='+global.CONFIG['sms']['api-key']+'&sender='+global.CONFIG['sms']['senderid']+'&mobile='+mobile+'&otp='+otp;
        const options = {
            url: global.CONFIG['sms']['host']+''+path,
            method:'POST',
            headers: {
                'User-Agent': 'request',
                'Content-Type': 'application/json'
            }
        };
        return JSON.parse(await Request(options));

    }
}

module.exports = SMSApi;
