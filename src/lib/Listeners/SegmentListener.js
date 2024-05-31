"use strict";
Object.defineProperty(exports, '__esModule', {value:true});
const { FormatterListener } = require('../FormatterListener');


const plist = new FormatterListener;
class SegmentListener{
    renderToken(_buffer, tokenChains, tokenID, engine, debug, _marker, option) {
        if (_buffer.length==0) return;
        debug && console.log("render = token - on ", {tokenChains, tokenID, _buffer}); 
        return "(" + _buffer + ")";
    }
    store(){
        plist.store(arguments[0]);
    } 
}
exports.SegmentListener = SegmentListener;