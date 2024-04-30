"use strict";
Object.defineProperty(exports, '__esModule', { value: true });

const { FormatterOptions } = require('../FormatterOptions');
const { PatternMatchInfo } = require('../PatternMatchInfo');
const { FormattingBase } = require('./FormattingBase')
const { FM_APPEND, FM_START_LINE, FM_START_BLOCK, FM_END_BLOCK,
    FM_START_LINE_NEXT_LINE, FM_END_INSTRUCTION,
    FM_START_LINE_APPEND,
    PatternFormattingMode } = require('./FormattingMode');




const ALLOW_WHITE_SPACE = [FM_APPEND, FM_START_LINE];

class KAndRFormatting extends FormattingBase {
    mergeEndBlock = true;

    updateMergeEndBlock({ content, marker, option, extra, buffer, _hasBuffer, _hasExtra }) {
        if (this.mergeEndBlock) {
            return super.updateMergeEndBlock(arguments[0]);
        }
        let value = '';
        let mode = marker.mode;
        if (_hasBuffer) {
            value += buffer;
            mode = FM_START_LINE;
        }
        content = content.trimEnd();
        option.output.push(content);
        option.appendExtraOutput();
        content = option.flush(true);
        return { value, content, mode };
    }
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
    /**
     * 
     * @param {*} formatter 
     * @param {*} marker 
     * @param {*} option 
     * @param {*} _buffer 
     * @param {*} _refData 
     * @returns 
     */
    handleEndFormattingBeforeStore(formatter, marker, option, _buffer, _refData) {
        let { _b } = _refData;
        let sb = '';
        let _bbuffer = option.buffer;
        const { formatterBuffer, lineFeedFlag } = option;

        if (this.mergeEndBlock) {
            // + | remove last empty items.
            _bbuffer = _bbuffer.trimEnd(); 
        }
        if (marker.childs.length == 0) {
            sb = _bbuffer;
            if (lineFeedFlag){
                option.lineFeedFlag = false;
                const buffer = option.saveBuffer();
                option.appendExtraOutput();
                option.output.push(_b.trimStart());                
                sb += option.flush(true);
                option.restoreSavedBuffer();
            }else{
                sb += _b.trimStart();
            }
            formatterBuffer.clear();  
            formatterBuffer.appendToBuffer(sb);
            formatterBuffer.clearOutput();
            _b = '';
        } else {
            option.formatterBuffer.clear();
            option.formatterBuffer.appendToBuffer(_bbuffer);

            if (this.mergeEndBlock) {
                if ((marker.mode == FM_END_BLOCK) && (marker.childs.length == 1)) {
                    // + | merge close tag
                    option.formatterBuffer.appendToBuffer(_b.trimEnd());
                    _b = '';
                }
            } else {
                if ((marker.mode == FM_END_BLOCK) && (marker.childs.length == 1)) {
                    // + | merge close tag
                    option.storeToOutput({ clear: true });
                    option.formatterBuffer.appendToBuffer(_b.trimEnd());
                    option.storeAndUpdateBuffer();
                    _b = '';
                }
            }
        }
        let _c_mode =  (marker.childs == 0)
            ? FM_APPEND : FM_END_BLOCK;
    
        // + | update marker mode to pass to parent
        // marker.mode = _c_mode;
        option.nextMode = _c_mode;
        option.startLine = (_c_mode== FM_END_BLOCK);
        if (_b && (marker.formattingMode == PatternFormattingMode.PFM_LINE_JOIN_END)) {
            option.formatterBuffer.appendToBuffer(_b.trimEnd());
            _b = '';
        }


        _refData._b = _b;
        return _refData;
    }
    onAppendBlock(content, extra, buffer, _hasBuffer, _hasExtra, isEntryContent) {
        let _ld = '';
        if (extra.length > 0) {
            _ld += extra;
        }
        if (buffer.length > 0) {
            _ld += buffer;
        }
        content = !isEntryContent ? content.trimEnd() : content;
        if (!this.mergeEndBlock){
            option.appendExtraOutput();
            option.formatterBuffer.appendToBuffer(_ld.trimStart());
            option.store();
            _ld = option.flush(true);
        }
        return { content, _ld};
    }
    handleEndFound(formatter, marker, option, _buffer, _b) {
        let sb = '';
        if (marker.childs.length == 0) {
            sb = _buffer.trimEnd() + _b.trimStart();
            option.appendToBuffer(sb, marker);
        }

        return marker.parent;
    }

    formatJoinFirstEntry(entryBuffer, buffer) {
        return [entryBuffer, buffer].join('');
    }

    formatBufferMarker(formatter, _marker, option) {
        let _buffer = option.buffer;
        const { parent } = _marker;
        const { formattingMode } = _marker;

        switch (formattingMode) {
            case PatternFormattingMode.PFM_LINE_FEED:
                if (parent) {
                    _marker.mode = FM_START_LINE;
                    this._updateGlobalMarkerOptionDefinition(_marker, option);
                } else {
                    // + | update current buffer to handle
                    formatter.updateBuffedValueAsToken(_buffer, _marker, option);
                    if (option.depth == 0) {
                        option.skipEmptyMatchValue = true;
                    }
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
    onLastExpectedBlockStart({ _old, option }) {
        if (this.mergeEndBlock) {
            return;
        }
        if (!_old.blockStarted && (option.output.length > 0)) {
            option.output.push(option.buffer);
            let _buffer = option.flush(true);
            option.formatterBuffer.appendToBuffer(_buffer);
            option.storeAndUpdateBuffer();
        }
    }
}

exports.KAndRFormatting = KAndRFormatting;
exports.FormattingBase = FormattingBase