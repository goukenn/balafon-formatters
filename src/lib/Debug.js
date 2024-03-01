"use strict";
Object.defineProperty(exports, '__esModule', {value:true});

const LOG_NAME = '[igk-formatters]'
class Debug{
    static LogLevel = 3;
    static #Enabled = false;
    
    static get IsEnabled(){
        return Debug.#Enabled;
    }
    static log(msg, level){
        if (level){
            if (level < Debug.LogLevel){
                return;
            }
        }
        if (typeof(msg)=='object'){
            msg = JSON.stringify(msg, (k, v)=>{
                if (k.length==0){
                    return v;
                }
                if (typeof(v)=='object'){
                    return {};//'[object]';
                }
                if (typeof(v)=='array'){
                    return [];//'[array]';
                }
                return v;
            });
        }
        console.log(`${LOG_NAME} - ${msg}`);
    }
    /**
     * enable debug globally
     * @param {?bool} enable 
     */
    static Enable(enable){
        Debug.#Enabled = enable;
    }
}

exports.Debug = Debug;