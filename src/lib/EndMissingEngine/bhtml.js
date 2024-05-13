"use strict";
Object.defineProperty(exports, '__esModule', { value: true });

const {Utils } = require("../Utils");

const auto_closed = 'link|img|input';
class bhtml{
    isAutoCloseTag(target, value){
        return auto_closed.split('|').indexOf(target) != -1;
    }
    autoCloseTagValue(target, value, marker, option){
        let _value = value;
        let _is_closed = />\s*$/.test(value);
        let _self_closed = /\/>\s*$/.test(value);
        let _close_tag = "</"+target+">";
        let _captures = marker.endMissingCaptures || marker.endCaptures || marker.captures;
        if (!this.isAutoCloseTag(target,value)){
            throw Error("not implement");       
        }else{
            _close_tag = '/>';
            
            Utils.RenderToBuffer(_close_tag, marker,_captures, option);

            if (!_self_closed){
                _value = _value.replace(/>\s*$/, _close_tag);
            } else {
                if (!_is_closed){
                    _value += '>';
                }
                _value +=_close_tag;
            }  
        }
        return _value;
    }
}

exports.bhtml = bhtml;