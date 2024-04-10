"use strict";
Object.defineProperty(exports, '__esModule', { value: true });

exports.FormattingBase = void (0);

const CODE_STYLE_FORMATTERS = {};
/**
 * operation to manipulate the formatter buffer on condition.
 */
class FormattingBase {
    /**
     * 
     * @param {*} mode 
     * @param {*} option 
     */
    updateGlobalFormatting(mode, option){
        switch(mode){
            case FM_START_LINE:
                option.lineFeedFlag = true;
                break;
        }
    }
    /**
     * update mode on close marker 
     * @param {*} marker 
     */
    closeMarker(marker){
        if ((marker.isBlock)&&(marker.mode == FM_APPEND)){
            marker.mode = FM_START_LINE;
        }
    }
    updateMergeEndBlock({content, marker, option, extra, buffer, _hasBuffer, _hasExtra}){
        let value = '';
        let mode = marker.mode;
        if (_hasBuffer){
            value+= buffer;
            mode = FM_START_LINE;
        }
        content = content.trimEnd();
        return {value, content, mode};
    }
    /**
     * depending on marker mode update old marker content new value
     */
    updateOldMarkerContent({ content, marker, extra, buffer, option }) {
        let _ld = '';
        let { mode } = marker;
        const { formatterBuffer } = option;
        let _hasExtra = (extra.length>0);
        let _hasBuffer = (buffer.length > 0);
        if (!_hasExtra && !_hasBuffer){
            return content;
        }
        switch (mode) {
            case FM_START_LINE:
                _ld = this._treatOldMarkerContent(option, true, extra, buffer, _hasBuffer, _hasExtra); 
                if (_ld.length>0){
                    mode = FM_APPEND; 
                }
                break;
            case FM_END_BLOCK:
                let value = '';
                ({value, mode, content} = this.updateMergeEndBlock({content, marker, extra, buffer, option, _hasBuffer, _hasExtra}));
                _ld = value;
                break;
            case FM_START_BLOCK: 
                    option.appendExtraOutput();
                    if (_hasExtra)
                        option.output.push(extra);
                    if (_hasBuffer){
                        formatterBuffer.appendToBuffer(buffer);
                        option.store();
                    }
                    _ld = option.flush(true);
                    mode = FM_APPEND; 
                break;
            case FM_END_INSTRUCTION:
                if (_hasExtra){
                    option.appendExtraOutput();
                    option.output.push(extra);
                    _ld = option.flush(true);
                    mode = FM_START_LINE;
                }
                if (buffer.length > 0) {
                    _ld += buffer;
                    mode = FM_START_LINE;
                }
                break;
            case FM_APPEND:
                if (extra.length > 0) {
                    _ld += extra;
                }
                if (buffer.length > 0) {
                    _ld += buffer;
                }
                break;
            case FM_START_LINE_NEXT_LINE:
                option.appendExtraOutput();
                if (_hasBuffer){
                    formatterBuffer.appendToBuffer(buffer);
                    option.store();
                } 
                _ld = option.flush(true);
                mode = FM_START_LINE_APPEND;
                break;
            case FM_START_LINE_APPEND:
                _ld = this._treatOldMarkerContent(option, true, extra, buffer, _hasBuffer, _hasExtra); 
                mode = FM_APPEND;
                break;
            default:
                throw new Error('mode not handle : '+mode);
                break;
        }
        marker.mode = mode;
        return content + _ld;
    }
    _treatOldMarkerContent(option, extraOutput, extra, buffer, _hasBuffer, _hasExtra){
        const { formatterBuffer } = option; 
        extraOutput && option.appendExtraOutput();
        if (_hasExtra){
            option.output.push(extra);
        }
        if (_hasBuffer){
            formatterBuffer.appendToBuffer(buffer);
            option.store();
        } 
        let _ld = option.flush(true);
        return _ld.trim().length>0?_ld:''; 
    }

    /**
     * 
     * @param {*} formatter 
     * @param {PatternMatchInfo} marker 
     * @param {*} option 
     */
    onAppendToBuffer(formatter, marker, value, option) {

        marker.mode = FM_APPEND;
    }
    handleEndFound(formatter, marker, option, _buffer, _b) {
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

    /**
     * handle end end block buffer
     * @param {*} _marker 
     * @param {*} _buffer 
     * @param {*} option 
     * @param {*} _old 
     * @returns 
     */
    handleEndBlockBuffer(_marker, _buffer, option, _old) {
        let _sbuffer = '';
        if (option.depth > 0) {
            if (!_old.blockStarted && (_old.content.length == 0)) {
                option.store();
                _sbuffer = option.flush(true);
            }
            else {
                if (_old.entryBuffer.length == _old.content.trim().length) {
                    option.store();
                }
                _sbuffer = option.flush(true) + _buffer;
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
            switch (mode) {
                case FM_START_LINE_NEXT_LINE:
                case FM_END_BLOCK:
                    // apend 
                    // let _buffer = option.buffer; 
                    option.lineFeedFlag = true;
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
        const { parent, isBlock } = marker_info;
        if (parent) {
            const { mode, childs, isAutoBlockElement } = parent;
            if (isAutoBlockElement) {
                if ((childs.length > 1)) {
                    if (mode == FM_START_LINE) {

                        option.saveBuffer();
                        let _frm = option.formatterBuffer;
                        // _frm.output.push('');
                        _frm.appendToBuffer(_buffer);
                        option.store();
                        _buffer = option.flush(true);
                        option.restoreSavedBuffer();
                        option.output.push(_buffer);
                        _buffer = '';
                    }
                } else if (isBlock && !option.formatterBuffer.isEmpty) {
                    let c = option.buffer;
                    c = option.flush(true) + c; 
                    option.output.push(c+_buffer);
                    _buffer = option.flush(true);
                    parent.mode = FM_END_BLOCK;
                }
            }
        }
        option.formatterBuffer.appendToBuffer(_buffer);
    }

    onEndUpdateBuffer({ marker, option, update, onSingleLine }) {
        const inf = {};
        inf.flushBuffer = marker.isBlock && onSingleLine;
        return update(inf, option);
    }

    /**
    * treat and start block definition 
    * @param {Formatters} formatter 
    * @param {PatternMatchInfo} patternInfo 
    * @param {FormatterOptions} option 
    */
    startBlockDefinition(formatter, patternInfo, option) {
        patternInfo.isBlockStarted = true;
        formatter._startBlock(option);
        if (!option.isCurrentFormatterBufferIsRootBuffer) {
            let _cf = option.flush(true);
            if (_cf.length > 0) {
                throw new Error('start block contains definition: ' + _cf);
            }
        }
        // if (option.markerInfo.length > 0) {
        //     const _old = option.markerInfo[0];
        //     _old.content = _old.content.trim();
        // }
        patternInfo.mode = FM_START_BLOCK;
        const { parent } = patternInfo;
        if (parent) {
            parent.mode = FM_APPEND;
        }
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
                option.appendExtraOutput();
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
    handleEndInstruction(formatter, marker, _old, option) {
        // instruction  
        if (_old.marker.mode == 2) {
            // + | change mode to 4 so that next line must on new line
            _old.marker.mode = 4;
        } else {
            _old.marker.mode = FM_END_INSTRUCTION; // append - then end instruction go to 
        }
    }
    formatJoinFirstEntry(entryBuffer, buffer) {
        return [entryBuffer, buffer].join("\n");
    }
    formatHandleExtraOutput(marker, _extra, option) {
        let { mode } = marker;
        let r = _extra;
        switch (mode) {
            case FM_END_INSTRUCTION:
                option.saveBuffer();
                option.appendExtraOutput();
                option.output.push(r);
                r = option.flush(true);
                option.restoreSavedBuffer();
                mode = FM_APPEND;
                break;
        }
        marker.mode = mode;
        return r;
    }
}

//+ |  on end append technique



exports.FormattingBase = FormattingBase
/**
 * code style formatters
 */
const { KAndRFormatting } = require('./KAndRFormatting');
const { FM_APPEND, FM_START_LINE, FM_START_BLOCK, FM_END_BLOCK, FM_START_LINE_NEXT_LINE, FM_END_INSTRUCTION , FM_START_LINE_APPEND} = require('./FormattingMode');
const { FormatterOptions } = require('../FormatterOptions');
const { Formatters } = require('../Formatters'); 
const { PatternMatchInfo } = require('../PatternMatchInfo');


const Library = {
    KAndRFormatting
};