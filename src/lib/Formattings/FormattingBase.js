"use strict";
Object.defineProperty(exports, '__esModule', { value: true });

exports.FormattingBase = void (0);
const { Debug } = require("../Debug");
const { FormatterSegmentJoin } = require("../FormatterSegmentJoin");
const { FormatterBuffer } = require("../FormatterBuffer");


const CODE_STYLE_FORMATTERS = {};
/**
 * operation to manipulate the formatter buffer on condition.
 */
class FormattingBase {
    trimConstant;
    
    startBlock({ currentMode }, _marker, _option) {
        currentMode = FM_START_LINE;
        arguments[0].currentMode = currentMode;
    }
    /**
     * update buffer prev content constant
     * @param {*} data 
     * @param {*} mode 
     * @param {*} _marker 
     * @param {*} option 
     */
    updateBufferConstant(data, mode, _marker, option) {
        const { formatterBuffer } = option;
        switch (mode) {
            case FM_START_LINE:
            case FM_END_BLOCK:
                data = data.trimStart();
                let _buffer = option.buffer;
                if (_buffer.length > 0) {
                    option.output.push(_buffer); // append line 
                    formatterBuffer.clear();
                }
                option.appendToBuffer(data, _marker);
                mode = FM_APPEND;
                break;
            case FM_APPEND:
                option.appendToBuffer(data, _marker);
                break;
            case FM_START_BLOCK:
                // +| depending on the formatting mode start new block
                data = data.trimStart();
                if (data.length > 0) {
                    option.appendToBuffer(data, _marker);
                    mode = FM_APPEND;
                }
                break;
            case FM_END_INSTRUCTION: // update buffer after end instruction
                data = data.trimStart();
                if (data.length > 0) {
                    option.lineFeedFlag && option.appendExtraOutput();
                    option.appendToBuffer(data, _marker);
                    if (option.output.length > 0) {
                        option.store();
                        formatterBuffer.appendToBuffer(option.flush(true));
                    }
                    mode = FM_APPEND;
                }
                break;
            case FM_START_LINE_APPEND:
                data = data.trimStart();
                if (data.length > 0) {
                    option.appendToBuffer(data, _marker);
                    option.store();
                    mode = FM_APPEND;
                }
                break;
            default:
                throw new Error('update Buffer not handled : ' + mode);
        }
        _marker.mode = mode;
    }
    /**
     * update marker global option
     * @param {*} param0 
     */
    updataMarkerGlobalOption({ mode, lineFeedFlag, startLine }, option) {
        const e = arguments[0];
        switch (mode) {
            case FM_START_LINE_NEXT_LINE:
            case FM_END_BLOCK:
            case FM_START_LINE:
            case FM_END_INSTRUCTION:
            case FM_APPEND_BLOCK:
                startLine = true;
                lineFeedFlag = true;
                break;
            default:
                break;
        }

        e.lineFeedFlag = lineFeedFlag;
        e.startLine = startLine;
        if (option) {
            option.startLine = startLine;
            option.lineFeedFlag = lineFeedFlag;
            option.nextMode = mode;
        }
    }
    /**
     * 
     * @param {number} mode 
     * @param {*} option 
     */
    updateGlobalFormatting({mode, formattingMode}, { lineFeedFlag, line, pos, length  }) {
        // after mode update global mode options
        const option = arguments[1];

        if (formattingMode==PatternFormattingMode.PFM_APPEND_THEN_LINE_FEED){
            if (mode == FM_START_LINE){
                mode = FM_APPEND;
                lineFeedFlag = (pos >= length) || (line.trimEnd().length == pos);
            }
        }
        switch (mode) {
            case FM_START_LINE:
            case FM_START_BLOCK:
            case FM_END_BLOCK:
                lineFeedFlag = true;
                break;
        }
        option.lineFeedFlag = lineFeedFlag;
    }
    /**
     * treat contant value before append to buffer
     * @param {*} value 
     * @param {*} marker 
     */
    treatConstantValue(value, marker, option){
        if (this.trimConstant)
        {
            value = value.trimEnd();
        }
        return value;
    }
    /**
     * retrieve append mode
     */
    get appendMode() {
        return FM_APPEND;
    }
    updateStartFormatting(mode, option) {
        switch (mode) {
            case FM_START_LINE:
            case FM_START_BLOCK:
                option.startLine = true;
                break;
        }

    }
    updateEmptySkipMatchedValueFormatting(parent, option, {formattingMode }) {
        if (parent) {
            parent.mode = FM_START_LINE;
        } else {
            let _gformatting = FM_APPEND;
            if (formattingMode == PatternFormattingMode.PFM_LINE_FEED) {
                _gformatting = FM_START_LINE;
            }
            this.updateGlobalFormatting({mode:_gformatting, formattingMode}, option);
        }
    }
    /**
     * update mode on close marker 
     * @param {*} marker 
     */
    closeMarker(marker) {
        if ((marker.isBlock) && (marker.mode == FM_APPEND)) {
            marker.mode = FM_START_LINE;
        }
    }
    updateMergeEndBlock({ content, marker, option, extra, buffer, _hasBuffer, _hasExtra }) {
        let value = '';
        let mode = marker.mode;
        if (_hasBuffer) {
            value += buffer;
            mode = FM_START_LINE;
        }
        content = content.trimEnd();
        return { value, content, mode };
    }
    /**
     * 
     * @param {*} marker 
     * @param {FormatterOptions} option 
     */
    updateEndLineUpdateMode(marker, option) {
        if (marker) {
            const _old = option.markerInfo[0];
            const { formattingMode, mode } = marker; 
            let _buffer_is_empty = option.formatterBuffer.isEmpty;
            if ((formattingMode == PatternFormattingMode.PFM_APPEND_THEN_LINE_FEED) && (mode == FM_APPEND)) {
                option.nextMode = FM_START_LINE;
                marker.mode = FM_START_LINE; 
                // + | change the current mode to start line request
                if ((_old.currentMode == FM_APPEND) && (_buffer_is_empty)){
                    _old.currentMode = FM_START_LINE;
                }
            }
        }
    }
    updatePreprendExtra(prependExtra, extra, option){ 
        option.saveBuffer(); 
        let r = '';
        (!Array.isArray(prependExtra) ? [prependExtra] : prependExtra).
        forEach(i=>{
            option.formatterBuffer.appendToBuffer(i);
            option.store(); 
        });
        if (extra !== null)
            option.output.push(extra);
        r = option.flush(true);
        option.restoreSavedBuffer();
        extra =r;
        return {extra};
    }    
    // + | -------------------------------------------------------------
    // + | depending on marker mode update old marker content new value
    // + | update from buffer content. 
    // + | -------------------------------------------------------------    
    updateOldMarkerContent({ content, marker, extra, buffer, data, segments, option, mode, isEntryContent, 
        autoStartLine, prependExtra, bufferData }) {
        let _ld = '';
        const { debug, joinWith, formatterBuffer } = option;
        mode = mode == undefined ? FM_APPEND : mode;
        const _props = arguments[0];
        let _hasExtra = (extra.length > 0);
        let _hasBuffer = (buffer.length > 0);
        if (!_hasExtra && !_hasBuffer) {
            return content;
        }
        if (prependExtra){
            // + | ----------------------------------------------------------
            // + | prepend extra data 
            // + | ----------------------------------------------------------
            ({extra} = this.updatePreprendExtra(prependExtra, extra, option)); 
            prependExtra = null;
        }

        const _undef = typeof (marker.mode) == 'undefined'; 
        let _append_next_mode = _undef ? FM_APPEND : marker.mode;

        debug?.feature('update-old-buffer') && (function (){
            Debug.log("--::: update old buffer :::--");
            console.log({ content, buffer, extra, mode, data });
        })();

        const _updateLd = ()=>{
            const _ref_data = {};
            const _buffer = option.flush(true, _ref_data);
            _ld += _buffer;
            _updateSegment({buffer: _buffer, data:_ref_data.data}); 
        };
        const _updateSegment = ({buffer, data})=>{
            segments.bufferSegment.push(buffer);
            segments.dataSegment.push(data);
        };
        // + | update what for buffer data
        const _updateBufferedData = ({dataSegment, bufferSegment})=>{ 
            FormatterSegmentJoin.UpdateSegmentData(segments, {dataSegment, bufferSegment}); 
        };
        

        switch (mode) {
            case FM_START_LINE:
                FormatterBuffer.TreatMarkedSegments(bufferData, 'trimmed'); 
                buffer = bufferData.bufferSegment.join('');
                if (joinWith) {
                    _ld = buffer;
                } else {
                    _ld = this._treatOldMarkerContent(option, true, extra, buffer, _hasBuffer, _hasExtra);
                }
                if (_ld.length <= 0) {
                    _append_next_mode = FM_START_LINE;
                }
                break;
            case FM_END_BLOCK:
                // after end block
                // start line 
                option.appendExtraOutput();
                let value = '';
                ({ value, mode, content } = this.updateMergeEndBlock({ content, marker, extra, buffer, option, _hasBuffer, _hasExtra }));
                option.formatterBuffer.appendToBuffer(value);
                option.store();
                _ld = option.flush(true);
                break;
            case FM_START_BLOCK: // every block start with extra output
                option.appendExtraOutput();
                if (_hasExtra)
                    option.output.push(extra);
                if (_hasBuffer) {
                    formatterBuffer.appendToBuffer(buffer);
                    option.store();
                }
                _ld = option.flush(true);
                if (_append_next_mode == FM_END_BLOCK) {
                    _append_next_mode = FM_START_LINE;
                }
                break;
            case FM_END_INSTRUCTION: // after end instruction 
                if (_hasExtra) { 
                    option.output.push(extra);
                    _ld = option.flush(true);
                    _hasExtra = false;
                }
                if (_hasBuffer) {
                    if (!_hasExtra) {
                        option.appendExtraOutput();
                    }
                    option.formatterBuffer.appendToBuffer(buffer.trimStart());
                    option.store();
                    _ld += option.flush(true);
                }
                break;
            case FM_APPEND_TO_NEXT:
                if (_hasExtra) {
                    option.appendExtraOutput();
                    option.output.push(extra);
                    _ld = option.flush(true); 
                } 
                if (buffer.length > 0) {
                    if (!/\\s+$/.test(content)) {
                        content += ' ';
                    }
                    _ld += buffer;
                }
                break;
            case FM_APPEND:
                if (_hasExtra) {
                    option.appendExtraOutput();
                    option.output.push(extra);
                    _updateLd();
                }
                if (buffer.length > 0) {
                    _ld += buffer;
                    // _updateSegment({buffer, data});
                    _updateBufferedData(bufferData);                   
                }
                break;
            case FM_START_LINE_NEXT_LINE:
                option.appendExtraOutput();
                if (_hasBuffer) {
                    formatterBuffer.appendToBuffer(buffer);
                    option.store();
                }
                _ld = option.flush(true);
                mode = FM_START_LINE_APPEND;
                break;
            case FM_START_LINE_APPEND:
                _ld = this._treatOldMarkerContent(option, true, extra, buffer, _hasBuffer, _hasExtra);
                _append_next_mode = FM_APPEND;
                break;
            case FM_APPEND_BLOCK:
                ({ content, _ld } = this.onAppendBlock(content, extra, buffer, _hasBuffer, _hasExtra, isEntryContent));
                break;

            default:
                throw new Error('mode not handle : ' + mode); 
        } 
        mode = _append_next_mode;
        marker.mode = mode;
        this._updateGlobalMarkerOptionDefinition(marker, option);
        _props.mode = marker.mode;
        _props.autoStartLine = autoStartLine;
        _props.prependExtra = prependExtra; 
        return content + _ld;
    }

    onAppendBlock(content, extra, buffer, _hasBuffer, _hasExtra) {
        let _ld = '';
        if (extra.length > 0) {
            _ld += extra;
        }
        if (buffer.length > 0) {
            _ld += buffer;
        }
        return { content, _ld };
    }
    /**
     * update defition 
     * @param {*} marker 
     * @param {*} option 
     */
    _updateGlobalMarkerOptionDefinition(marker, option) {
        const { mode, formattingMode } = marker;
        const { lineFeedFlag, startLine } = option;
        this.updataMarkerGlobalOption({ mode, formattingMode, lineFeedFlag, startLine }, option);
    }
    _treatOldMarkerContent(option, extraOutput, extra, buffer, _hasBuffer, _hasExtra) {
        const { formatterBuffer } = option;
        //extraOutput && !_hasExtra && option.appendExtraOutput();
        extraOutput && option.appendExtraOutput();
        if (_hasExtra) {
            option.output.push(extra);
        }
        if (_hasBuffer) {
            formatterBuffer.appendToBuffer(buffer);
            option.store();
        }
        let _ld = option.flush(true);
        return _ld.trim().length > 0 ? _ld : '';
    }
    /**
     * is line feed
     * @param {number} formattingMode 
     * @returns {boolean}
     */
    isLineFeed(formattingMode) {
        return (formattingMode == PatternFormattingMode.PFM_LINE_FEED) ||
            (formattingMode == PatternFormattingMode.PFM_APPEND_THEN_LINE_FEED);
    }
    /**
     * check if change to next append mode
     * @param {*} mode 
     * @returns 
     */
    canChangeNextFormatting(mode) {
        switch (mode) {
            case FM_END_INSTRUCTION:
            case FM_END_BLOCK:
                return true;

        }
        return false;
    }
    /**
     * 
     * @param {*} formatter 
     * @param {PatternMatchInfo} marker 
     * @param {*} option 
     */
    onAppendToBuffer(formatter, marker, value, option) {
        let { mode } = marker;
        const { debug } = option;
        if (option.markerInfo.length > 0) {
            const _old = option.markerInfo[0];
            debug?.feature('on-append-to-buffer') && Debug.log("onAppend to buffer - value={" + value + "}");
            // + | change current mode according to formatting rule
            if (marker.formattingMode == PatternFormattingMode.PFM_APPEND_THEN_LINE_FEED) {

                if (this.canChangeNextFormatting(_old.currentMode)) {
                    if (option.startLine && (option.line.trimStart().indexOf(value) == 0)) {
                        _old.currentMode = FM_START_LINE;
                    } else
                        _old.currentMode = FM_APPEND_TO_NEXT;
                }

            }
        }
        if (marker.lineFeed) {
            mode = FM_START_LINE;
        }
        marker.mode = mode;
       

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
    handleEndOnNonBlockElement(formatter, marker_info, option, { _b, _old }) {
        // + | append with line feed if requested
        const { parent, mode, lineFeed, formattingMode } = marker_info;
        let _lf = (formattingMode == PatternFormattingMode.PFM_LINE_FEED) || (lineFeed);
        if (parent) {
            if (_lf) {
                parent.mode = FM_START_LINE;
            }
            else {
                // + passing current mode to parent
                parent.mode = mode;
            }
        } else {

            if (_lf) {
                marker_info.mode = FM_START_LINE;
                // option.lineFeedFlag = true;
            } else {
                // + | depending on mode.
                this._updateGlobalMarkerOptionDefinition(marker_info, option);
            }
        }
        if (formattingMode == PatternFormattingMode.PFM_APPEND_THEN_LINE_FEED) {
            
            if ( this.onHandleSingleLineBuffer(option)&& 
                (_b.length > 0)) {
                option.saveBuffer();
                option.appendExtraOutput();
                option.formatterBuffer.appendToBuffer(_b);
                option.store();
                let _buffer = option.flush(true);
                option.restoreSavedBuffer();
                option.formatterBuffer.appendToBuffer(_buffer);
                _b = '';
            }
        } else if (_old?.currentMode== FM_START_LINE){
            option.saveBuffer();
            option.appendExtraOutput();
            option.formatterBuffer.appendToBuffer(_b);
            option.store();
            let _buffer = option.flush(true);
            option.restoreSavedBuffer();
            option.formatterBuffer.appendToBuffer(_buffer);
            _b = '';
        }
        return { _b };
    }
    onHandleSingleLineBuffer({buffer, startLine}){
        return startLine || buffer.split("\n").length > 1;
    }
    /**
     * join stream buffer
     * @param {*} mode 
     * @param {*} buffer 
     * @param {*} append 
     * @returns 
     */
    joinStreamBuffer(mode, buffer, append) {
        return buffer + append;
    }
    /**
     * operation to handle end block after restoring buffer
     * @param {Formatters} formatter 
     * @param {*} _marker parent marker info 
     * @param {string|{buffer:string, data:string}} _buffer 
     * @param {FormatterOptions} option 
     */
    updateEndBlockAfterRestoringBuffer(formatter, _marker, _buffer, _old, option) {
        const { parent, isBlock } = _marker;
        let _mark_buffer = false;
        if (parent) {
            const { mode, childs, isAutoBlockElement } = parent;
            if (isAutoBlockElement) {
                if ((childs.length > 1)) {
                    if (mode == FM_START_LINE) {

                        option.saveBuffer();
                        let _frm = option.formatterBuffer; 
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
                    option.output.push(c + _buffer);
                    _buffer = option.flush(true);
                    parent.mode = FM_END_BLOCK;
                }
            } else {
                _mark_buffer = true;
            }
        }

        if (_buffer?.output?.length>0){
            option.output.push(..._buffer.output);
        }
        if (_buffer?.dataOutput?.length>0){
            option.dataOutput.push(..._buffer.dataOutput);
        }


        const _next_old = (option.markerInfo.length > 0) ? option.markerInfo[0] : null;
        if (!_mark_buffer)
            option.formatterBuffer.appendToBuffer(_buffer);
        else {
            if (_next_old && _next_old.joinWith) {
                formatter.appendJoinToBuffer(_next_old.joinWith, option);
                _next_old.joinWith = null;
            }
            if (typeof(_buffer)=='string'){
                option.appendToBuffer(_buffer, _marker);
            } else {
                option.formatterBuffer.appendToBuffer(_buffer);
            }
        }
        if (isBlock && _next_old) {
            // + | update marker definition depending of the formatter
            if (_next_old.currentMode == FM_APPEND) {
                // change mode to append item
                _next_old.currentMode = FM_APPEND_BLOCK;
                option.nextMode = _next_old.marker.mode
                    = FM_START_LINE;
            }
        }
    }
    updateMatchNextFormatting(marker, option){
        const {formattingMode} = marker;
        let { lineFeedFlag, nextMode } = option;
        switch (formattingMode) {
            case PatternFormattingMode.PFM_LINE_FEED:
                lineFeedFlag = true;
                nextMode = FM_START_LINE;
                break;        
            default:
                break;
        }
        option.lineFeedFlag = lineFeedFlag;
        option.nextMode = nextMode;
    }
    updateNextSavedMode(mode, option) {
        switch (mode) {
            case FM_START_BLOCK:
                mode = FM_END_BLOCK;
                break;
        }
        option.nextMode = mode;
        option.startLine = this.isStartLine(mode);
    }
    isStartLine(mode) {
        return mode == FM_END_BLOCK;
    }
    /**
     * on end update buffer
     */
    onEndUpdateBuffer({ marker, option, update, _buffer, _data }) {
        return update({ marker, _buffer, _data }, option);
    }
    /**
     * 
     * @param {*} old 
     * @param {*} option 
     */
    updateBlockMarkerPropertyMode(old, option){
        old.currentMode = FM_APPEND_BLOCK;
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
    onEndInstruction(marker, option) {
        // instruction        
        marker.mode = FM_END_INSTRUCTION;
        this._updateGlobalMarkerOptionDefinition(marker, option);
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
const { FM_APPEND, FM_START_LINE, FM_START_BLOCK, FM_END_BLOCK, FM_START_LINE_NEXT_LINE, FM_APPEND_BLOCK,
    FM_END_INSTRUCTION, FM_START_LINE_APPEND, FM_APPEND_TO_NEXT
    , PatternFormattingMode,
    FormattingMode } = require('./FormattingMode');
const { FormatterOptions } = require('../FormatterOptions');
const { Formatters } = require('../Formatters');
const { PatternMatchInfo } = require('../PatternMatchInfo');


const Library = {
    KAndRFormatting
};