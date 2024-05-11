"use strict";
Object.defineProperty(exports, '__esModule', { value: true });

const auto_closed = 'link|img|input';
class bhtml{
    isAutoCloseTag(target, value){
        return auto_closed.split('|').indexOf(target) != -1;
    }
    autoCloseTagValue(target, value){
        if (!this.isAutoCloseTag(target,value)){
            if(/>/.test(value)){
                return "</"+target+">";
            }
            return "></"+target+">";
        }else{
            if(value.length == value.lastIndexOf('>')){
                return "/>";
            }
            return "></"+target+">";
        }
    }
}

exports.bhtml = bhtml;