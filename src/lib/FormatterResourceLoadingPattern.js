const { PatternMatchInfo } = require("./PatternMatchInfo");

Object.defineProperty(exports, '__esModule', {value:true});

class FormatterResourceLoadingPattern extends PatternMatchInfo{
    constructor(id){
        super()
        Object.defineProperty(this, 'refId', {get(){return id;}});
    }
}
exports.FormatterResourceLoadingPattern = FormatterResourceLoadingPattern;