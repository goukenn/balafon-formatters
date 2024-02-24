"use strict";
Object.defineProperty(exports, '__esModule', {value:true});

const LOG_NAME = '[igk-formatters]'
class Debug{
    static LogLevel = 3;
    static logger (logger){

    }
    static log(msg, level){
        if (level){
            if (level < Debug.LogLevel){
                return;
            }
        }
        console.log(`${LOG_NAME} - ${msg}`);
    }
}

exports.Debug = Debug;