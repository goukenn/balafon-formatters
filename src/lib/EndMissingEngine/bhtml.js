"use strict";
Object.defineProperty(exports, '__esModule', { value: true });

const { FormatterOptions } = require("../FormatterOptions");
const { Utils } = require("../Utils");

const auto_closed = 'link|img|input';
class bhtml {
    isAutoCloseTag(target, value) {
        return auto_closed.split('|').indexOf(target) != -1;
    }
    /**
     * auto close tagreturn buffer content
     * @param {string} target - tag name 
     * @param {*} value - data baleur
     * @param {*} marker - source marker
     * @param {FormatterOptions} option - formatting option
     * @returns {string}
     */
    autoCloseTagValue(target, value, marker, option, captures) {
        let _value = value;
        let _lastData = _value.dataSegment.pop();
        let _lastBuffer = _value.bufferSegment.pop();
        let _load_data = (_cp) => {
            _value.dataSegment.push(_cp.data);
            _value.bufferSegment.push(_cp.buffer);
        };

        let _captures = captures || marker.endCaptures || marker.captures; //[]; //marker.endMissingCaptures || marker.endCaptures || marker.captures;
        let _is_closed = />\s*$/.test(_lastData) || /^>/.test(_lastData);
        let _close_tag = "</" + target + ">";
        let _is_auto_closed = this.isAutoCloseTag(target, value);


        if (_is_auto_closed) {
            _close_tag = "/>";
        }
        let _p = Utils.CreateEndMatch(_close_tag);

        let tp = option.treatEndCaptures(marker, _p, _captures);
        //let cp = Utils.RenderToBuffer(_close_tag, marker, _captures, option);
        _load_data({ buffer: _lastBuffer, data: _lastData });
        if (!_is_closed) {
            if (!_is_auto_closed) {
                const _tdp = Utils.RenderToBuffer('>', marker, _captures, option);
                _load_data(_tdp);
            }
        }
        if ((marker.childs.length>0) && this._isChildBlock(marker.childs)) {
            option.saveBuffer();
            option.appendExtraOutput();
            option.appendExtraOutput();
            let refData={};
            const _rbuffer = option.flush(true, refData);  
            option.restoreSavedBuffer();
            _load_data({ buffer: _rbuffer, data: refData.data });
        }
        _load_data({ buffer: tp, data: _close_tag });
        return value.bufferSegment.join('');
    }
    _isChildBlock(childs){
        const { Formatters } =  Utils.Classes;
        return Formatters.IsChildBlock(childs);
    }
}

exports.bhtml = bhtml;