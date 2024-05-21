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

    /**
     * join stream buffer
     * @param {number} mode 
     * @param {string} buffer 
     * @param {string} append 
     * @returns 
     */
    joinStreamBuffer(mode, buffer, append) {
        switch (mode) {
            case FM_START_BLOCK:
                buffer = buffer.trimEnd() + append;
                return buffer;

        }
        return super.joinStreamBuffer(mode, buffer, append);
    }

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
        let _state_saved = option.bufferState;
        const { formatterBuffer, lineFeedFlag } = option;

        if (this.mergeEndBlock) {
            // + | remove last empty items.
            _bbuffer = _bbuffer.trimEnd();
        }
        if (marker.childs.length == 0) {
            sb = _bbuffer;
            if (lineFeedFlag) {
                option.lineFeedFlag = false;
                option.saveBuffer();
                option.appendExtraOutput();
                option.output.push(_b.trimStart());
                sb += option.flush(true);
                option.restoreSavedBuffer();
            } else {
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
        let _c_mode = (marker.childs == 0)
            ? FM_APPEND : FM_END_BLOCK;

        // + | update marker mode to pass to parent
        // marker.mode = _c_mode;
        option.nextMode = _c_mode;
        option.startLine = this.isStartLine(_c_mode);
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
        if (!this.mergeEndBlock) {
            option.appendExtraOutput();
            option.formatterBuffer.appendToBuffer(_ld.trimStart());
            option.store();
            _ld = option.flush(true);
        }
        return { content, _ld };
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
    /**
     * format buffer marker
     * @param {*} formatter 
     * @param {*} _marker 
     * @param {*} option 
     * @param {boolean} force force update 
     */
    formatBufferMarker(formatter, _marker, option, force=false) {
        let _buffer = option.buffer;
        const { parent, startOutput } = _marker;
        const { formattingMode, isBlock, isUpdatedBlock } = _marker;
        let update_line_feed = ()=>{
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
        };

        switch (formattingMode) {
            case PatternFormattingMode.PFM_LINE_FEED:
                // + | formatting request last fied 
                if (force ||((_marker.childs.length > 0) || (startOutput.trim().length>0))) {  
                   update_line_feed();
                }
                break;
            case PatternFormattingMode.PFM_LINE_FEED_IF_IS_UPDATED_BLOCK:
                if (force || ((_marker.childs.length>0) && (isBlock || isUpdatedBlock))){
                    update_line_feed();
                }
                break;
            case PatternFormattingMode.PFM_LINE_JOIN_END:
            case PatternFormattingMode.PFM_APPEND_THEN_LINE_FEED:
            case PatternFormattingMode.PFM_LINE_JOIN_END:
            // join line formatting mode 
            case PatternFormattingMode.PFM_LINE_JOIN:
            // enable streaming buffer
            case PatternFormattingMode.PFM_STREAMING:
                break;
            default:
                throw new Error('not implement formatting mode '+formattingMode);
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