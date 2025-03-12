"use strict";
Object.defineProperty(exports, '__esModule', {value:true});
const { Formatters, Utils, Patterns } = require("./lib/Formatters");

exports.Formatters = Formatters; 
exports.Patterns = Patterns; 
exports.CaptureInfo = Utils.Classes.CaptureInfo; 
exports.Utils = Utils; 
exports.Version = process.env.VERSION || '1.0.0'; 
exports.Web = (()=>{
    const Utils = require ("./web/Utils")
    return {
        Utils
    };
})();