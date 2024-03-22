"use strict";
Object.defineProperty(exports, '__esModule', { value: true });

exports.FormattingBase = void (0);

const CODE_STYLE_FORMATTERS = {};
/**
 * operation to manipulate the formatter buffer on condition.
 */
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
            if (!_old.blockStarted && (_old.content.length == 0)) {
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
    /**
     * on closing element passing mode to parent or ask for new line
     * @param {*} formatter 
     * @param {*} marker_info 
     * @param {*} option 
     */
    handleEndOnNonBlockElement(formatter, marker_info, option) {
        // + | append with line feed if requested
        const { parent, mode, isBlock } = marker_info;
        if (parent) {
            if (marker_info.lineFeed) {
                parent.mode = FM_START_LINE;
            }
            else {
                // + passing current mode to parent
                parent.mode = mode;
            }
        } else {
            // + | dependengin on mode.
            switch(mode){
                case FM_START_LINE_AND_APPEND:
                    // apend 
                    // let _buffer = option.buffer;
                    // option.output.push('');
                    option.lineFeedFlag = true; //'---';

                    break;
            }
        }
    }

    /**
     * operation to handle end block after restoring buffer
     * @param {Formatters} formatter 
     * @param {*} marker_info parent marker info 
     * @param {*} _buffer 
     * @param {FormatterOptions} option 
     */
    updateEndBlockAfterRestoringBuffer(formatter, marker_info, _buffer, _old, option) {
        const { parent } = marker_info;
        if (parent) { 
            const { mode, childs, isAutoBlockElement } = parent;
            if (isAutoBlockElement) {
                if (childs.length > 1) {
                    if (mode == FM_START_LINE) {

                        option.saveBuffer();
                        let _frm = option.formatterBuffer;
                        _frm.output.push('');
                        _frm.appendToBuffer(_buffer);
                        option.store();
                        _buffer = option.flush(true);
                        option.restoreSavedBuffer();
                        //marker_info.mode = FM_APPEND; 
                    }
                }
            }
        }
        option.formatterBuffer.appendToBuffer(_buffer);
    }

    /**
     * element is block by auto child setup
     * @param {} formatter 
     * @param {*} marker_info 
     * @param {*} option 
     */
    handleEndFormattingOnNonStartBlockElement(formatter, marker_info, option) {
        const { mode } = marker_info;
        // update buffer 
        switch (mode) {
            case FM_START_LINE:
                // append line 
                let _buffer = option.buffer;
                option.appendExtaOutput();
                let _sbuffer = option.flush(true);
                if (_buffer.length > 0) {
                    option.output.push(_buffer); // append line 
                }
                option.formatterBuffer.appendToBuffer(_sbuffer);
                marker_info.mode = FM_APPEND;
                break;
        }
    }
    handleBufferingNextToSbuffer(marker, option) {
        const { mode } = marker;
        let _sbuffer = option.buffer;
        // clear buffer 
        _sbuffer += option.flush(true);
        return _sbuffer;
    }
    handleEndInstruction(formatter, marker, _old, option){
         // instruction  
         if (_old.marker.mode == 2) {
            // + | change mode to 4 so that next line must on new line
            _old.marker.mode = 4;
        } else {
            _old.marker.mode = FM_END_INSTUCTION; // append - then end instruction go to 
        }
    }
}

//+ |  on end append technique



exports.FormattingBase = FormattingBase
/**
 * code style formatters
 */
const { KAndRFormatting } = require('./KAndRFormatting');
const { FM_APPEND, FM_START_LINE, FM_START_BLOCK, FM_END_BLOCK, FM_START_LINE_AND_APPEND, FM_END_INSTUCTION } = require('./FormattingMode');
const { FormatterOptions } = require('../FormatterOptions');
const { Formatters } = require('../Formatters');
const { FormatterBuffer } = require('../FormatterBuffer');


const Library = {
    KAndRFormatting
};