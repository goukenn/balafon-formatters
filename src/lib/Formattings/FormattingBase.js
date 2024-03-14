"use strict";
Object.defineProperty(exports, '__esModule', { value: true });

exports.FormattingBase = void (0);

const CODE_STYLE_FORMATTERS = {};
class FormattingBase {

    handleEndFound(formatter, marker, option, _buffer, _b) {
        if (marker.childs.length == 0) {

        }
        return marker.parent;
    }
    static Factory(name) {
        if (name in CODE_STYLE_FORMATTERS) {
            return CODE_STYLE_FORMATTERS[name];
        }
        let s = null;
        let cname = name + 'Formatting';
        const Library2 = Library;
        let fc = new Function('lib', `const {${cname}} = lib; return ${cname};`);
        let g = fc.apply(globalThis, [Library2]);
        if (g) {
            s = new g();
            CODE_STYLE_FORMATTERS[name] = s;
            return s;
        }
        throw new Error('missing code style formatters');
    }

    handleEndBlockBuffer(_marker, _buffer, option, _old) {
        let _sbuffer = '';
        if (option.depth > 0) { 
            if (!_old.blockStarted && (_old.content.length==0)) {
                option.store();
                _sbuffer = option.flush(true);
            } 
            else {
                if (_old.entryBuffer.length == _old.content.trim()) {
                    option.store();
                    _sbuffer = option.flush(true);
                } else {
                    _sbuffer = _buffer;
                    // clean buffer 
                    option.flush(true); 
                }
            }
        } else {
            option.store();
            _sbuffer = option.flush(true);
        }
        return { _sbuffer };
    }
}




exports.FormattingBase = FormattingBase
/**
 * code style formatters
 */
const { KAndRFormatting } = require('./KAndRFormatting');

const Library = {
    KAndRFormatting
};