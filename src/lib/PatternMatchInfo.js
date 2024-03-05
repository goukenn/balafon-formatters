"use strict";
Object.defineProperty(exports, '__esModule', {value:true});

/**
 * export pattern match info
 */
class PatternMatchInfo{
    /**
     * line contain
     */
    line;
    /**
     * the matching group
     */
    group;
    /**
     * calculated end regex
     */
    endRegex;
    /**
     * marker information
     */
    marker; 

    startLine = 0;

    range = {
        start : 0,
        end : 0
    }

    get index(){
        return this.group?.index;
    }
    get offset(){
        return this.group?.offset;
    }
    
}

exports.PatternMatchInfo = PatternMatchInfo;