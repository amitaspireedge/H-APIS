exports.generateOPT = function () {
    return Math.floor(1000 + Math.random() * 9000);
};

exports.generateActivationToken = function () {
    const randomstring = require("randomstring");
    return randomstring.generate();
};

exports.convertTo12Hour = function(time) {
    var hours;
    var minutes;
    if(isFloat(time)){
        var time = time.toString().split('.');
        hours = parseInt(time[0],10);
        minutes = parseInt(time[1],10);
        minutes = (minutes < 10) ? minutes*10 : minutes;
    }else{
        hours = time;
        minutes = 0;
    }

    var newTime = null;
    if(minutes < 10) {
        minutes = '0'+minutes;
    }
    if(hours > 12) {
        newTime = hours - 12;
        if(newTime < 10) {
            newTime = '0' + newTime;
        }
        newTime = newTime + ':' + minutes + ' pm';
    } else if(hours == 12){
        newTime = hours;
        newTime = newTime + ':' + minutes + ' pm';
    } else {
        if(hours < 10) {
            hours = '0'+hours;
        }
        newTime = hours + ':' + minutes + ' am';
    }
    return newTime;
};

function isFloat(n){
    return Number(n) === n && n % 1 !== 0;
}
