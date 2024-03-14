"use strict";
Object.defineProperty(exports, '__esModule', { value: true });

const { FormatterOptions } = require('../FormatterOptions');
const { PatternMatchInfo } = require('../PatternMatchInfo');
const { FormattingBase } = require('./FormattingBase')
const { FM_APPEND, FM_START_LINE, FM_START_BLOCK, FM_END_BLOCK, FM_START_LINE_AND_APPEND } = require('./FormattingMode');


const ALLOW_WHITE_SPACE = [FM_APPEND, FM_START_LINE];

class KAndRFormatting extends FormattingBase {
    mergeEndBlock = true;
    /**
     * check allow empty space 
     * @param {number} mode 
     * @param {FormatterOptions} option 
     * @return {bool}
     */
    allowEmptySpace(mode, option) {
        if (option.formatterBuffer.length > 0) {
            return true;
        }
        return ALLOW_WHITE_SPACE.indexOf(mode) != -1;
    }
    handleEndFormattingBeforeStore(formatter, marker, option, _buffer, _refData) {
        let { _b } = _refData;
        let sb = '';
        let _bbuffer = option.buffer;
        const { formatterBuffer } = option;

        if (this.mergeEndBlock){
            _bbuffer = _bbuffer.trim();
        } 
        if (marker.childs.length == 0) { 
            sb = _bbuffer + _b.trimStart();
            formatterBuffer.clear();
            //option.output.push(sb);

            formatterBuffer.appendToBuffer(sb);
            formatterBuffer.clearOutput();
            _b = '';
        } else {
            option.formatterBuffer.clear();
            option.formatterBuffer.appendToBuffer(_bbuffer.trimEnd());

            if (this.mergeEndBlock) {
                if ((marker.mode == FM_END_BLOCK) && (marker.childs.length == 1)) {
                    // + | merge close tag
                    option.formatterBuffer.appendToBuffer(_b.trimEnd());
                    _b = '';
                }
            }else {
                if ((marker.mode == FM_END_BLOCK) && (marker.childs.length == 1)) {
                    // + | merge close tag
                    option.storeToOutput({clear:true});  
                    option.formatterBuffer.appendToBuffer(_b.trimEnd()); 
                    option.storeAndUpdateBuffer();  
                    _b = '';
                }
            }
        }
        if (marker.parent) {
            marker.parent.mode = FM_END_BLOCK;
        }
        _refData._b = _b;
        return _refData;
    }
    handleEndFound(formatter, marker, option, _buffer, _b) {
        let sb = '';
        if (marker.childs.length == 0) {
            sb = _buffer.trimEnd() + _b.trimStart();
            option.appendToBuffer(sb, marker);
        }

        return marker.parent;
    }
    /**
     * treat and start block definition 
     * @param {Formatters} formatter 
     * @param {PatternMatchInfo} patternInfo 
     * @param {FormatterOptions} option 
     */
    startBlockDefinition(formatter, patternInfo, option) {
        patternInfo.isBlockStarted = true;
        const _old = option.markerInfo[0];
        formatter._startBlock(option);
        let _buffer = option.buffer;
        let _cf = option.flush(true);
        _old.content = _old.content.trim();
        // + | each block must start and content by to depth + 1;
        option.output.push(_cf + _buffer);
        patternInfo.mode = FM_START_BLOCK;
        const { parent } = patternInfo;
        if (parent) {
            parent.mode = FM_APPEND;
        }
    }

    formatBufferMarker(formatter, _marker, option) {
        let _buffer = option.buffer;
        const { parent } = _marker;
        const { formattingMode } = _marker;

        switch (formattingMode) {
            case 1:
                if (parent) {
                    parent.mode = FM_START_LINE_AND_APPEND;
                } else {
                    option.store();
                    option.output.push('');
                    _buffer = option.flush(true);
                    option.formatterBuffer.appendToBuffer(_buffer, _marker);
                }
                break;
        }
    }

    /**
     * on last handling mode
     * @param {*} param0 
     * @returns 
     */
    onLastExpectedBlock({ mode, option, buffer }) {
        let f = null;
        switch (mode) {
            case FM_END_BLOCK:
                if (buffer.length > 0) {
                    f = option.flush(true) + buffer;
                }
                break;
            default:
                option.store();
                break;
        }
        return f;
    }
    onLastExpectedBlockStart({_old, option}){
        if (this.mergeEndBlock){
            return;
        }
        if (!_old.blockStarted && (option.output.length>0)){
            option.output.push(option.buffer);
            let _buffer = option.flush(true);
            option.formatterBuffer.appendToBuffer(_buffer); 
            option.storeAndUpdateBuffer(); 
        }
    }
}

exports.KAndRFormatting = KAndRFormatting;
exports.FormattingBase = FormattingBase