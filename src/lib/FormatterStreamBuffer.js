"use strict";

Object.defineProperty(exports, '__esModule', { value: true });

const { FormatterBuffer } = require('./FormatterBuffer');
const { SpecialMeaningPatternBase, Patterns } = require('./Formatters');
const { PatternMatchInfo } = require("./PatternMatchInfo");
const { Utils } = require("./Utils");
const { FormattingMode } = require("./Formattings/FormattingMode");
const { Debug } = require("./Debug");

const FORMATTER_ID = '_formatter_buffer_';
/**
 * use to read stream buffer
 */
class FormatterStreamBuffer extends SpecialMeaningPatternBase {
    name = 'system.formatter.stream.buffer';
    formatterBuffer;
    from;
    initialMode = 1;
    startPosition;
    started = false;
    closed = false;
    marked = false;
    endFoundListener;
    /**
  * backup source marker info
  */
    sourceMarkerInfo;
    /**
     * backup stream token list
     */
    sourceTokenList;



    get matchType() {
        return 4;
    }
    constructor() {
        super();
        this.formatterBuffer = new FormatterBuffer;
        this.formatterBuffer.id = FORMATTER_ID;
        let m_saved = { saved: false, started: false };
        const self = this;

        this.appendToBuffer = function (v, def) {
            if (def) {
                const {_marker, formatting} = def;
                if (_marker && formatting && (_marker.mode != 1) ){
                    let _buffer = this.formatterBuffer.buffer;
                    v = formatting.joinStreamBuffer(_marker.mode, _buffer, v);
                    this.formatterBuffer.clear();
                }
            }
            this.formatterBuffer.appendToBuffer(v);
            return v;
        }
        this.clear = function () {
            this.formatterBuffer.clear();
        }
        Object.defineProperty(this, 'saved', { get() { return m_saved; } });
        Object.defineProperty(this, 'buffer', { get() { return this.formatterBuffer.buffer; } });
        Object.defineProperty(this, 'begin', { get() { return this.from?.begin; } });
        Object.defineProperty(this, 'end', { get() { return this.from?.end; } });
        Object.defineProperty(this, 'comment', { get() { return this.from?.comment; } });
        Object.defineProperty(this, 'index', { get() { return this.from?.index; } });
        Object.defineProperty(this, 'patterns', {
            get() {
                return this.from?.patterns;
            },
            set(v) {
                throw new Error('failed to set patterns not allowed');
            }
        });

        // Object.defineProperty(this, 'comment', {get:function(){
        //     return "Hello";
        // }});
        const q = this;
        Object.keys(FormatterStreamBuffer.prototype).forEach(a => {
            if (/(from)/.test(a))
                return;
            Object.defineProperty(q, a, {
                get: function () {
                    // console.log("this from ", q.from?.marker.comment);
                    return q.from ? q.from[i] : undefined;
                }
            });
        });

    }
    get newLineContinueState() {
        return false;
    }
    get throwErrorOnEndSyntax() {
        return true;
    }
    get isEndCaptureOnly() {
        return this.from.isEndCaptureOnly;
    }
    get isWhileCaptureOnly() {
        return this.from.isWhileCaptureOnly;
    }
    get isBeginCaptureOnly() {
        return this.from.isBeginCaptureOnly;
    }
    get patterns() {
        return this.from?.patterns;
    }
    get indexOf() {
        return this.from?.indexOf;
    }
    get endRegex() {
        return this.from?.endRegex;
    }

    get marker() {
        return this.from?.marker;
    }

    // class on end of file 
    stopAndExitStream(patternInfo, option, _bck, _restoreState, _old) {
        const { from, parent } = this;
        const { formatter, markerInfo } = option;

        const _line = this.buffer;
        let ret = null;
        let bck = { line: option.line, pos: option.pos };
        _restoreState(option, _bck);
        formatter._onEndHandler(from, option);

        if (bck.line.length == 0) {
            option.formatterBuffer.appendToBuffer(_line);
            this.clear();
            return null;
        }


        option.setSourceLine(_line,0);

        if (parent != null) {
            throw new Error("not implement exit parent.");
        } else {
            ret = this.moveToNextPattern(patternInfo, option, _old, from);
        }
        option.line = bck.line;
        option.pos = bck.pos;
        if (_old?.marker != from)
        option.shiftAndRestoreFrom(from);
        return ret;
    }
    /**
     * 
     * @returns 
     */
    handleMarkerListener(option) {
        const q = this;
        let _restored = false;
        let _topStreamRemoved = false;
        function _restoreSavedBuffer(option) {
            let _nbuffer = option.buffer;
            if (!_restored && (_nbuffer.length > 0)) {
                q.appendToBuffer(_nbuffer);
                //option.formatterBuffer.clear();
            }
        }
        function _restoreState(option, _bck) {
            if (_restored) {
                return;
            }
            _restoreSavedBuffer(option);
            option.appendToBufferListener = _bck.option.listener;
            _restored = true;
        };
        function _restoreBackupState(parent) {
            /**
             * restore backup state mode 
             */
            parent.mode = _bck.parentMode;
        }
        const _bck = q.saved;
        if (!q.started) {
            // save backup mode 
            q.started = true;
            const { parent } = q.from;
            if (parent) {
                _bck.parent = parent;
                //backup parent definition 
                _bck.parentMode = parent.mode;
            }
        } else {
            if (_bck.parent) {
                _bck.parent.mode = FormattingMode.FM_APPEND;
            }
        }

        return function (markerInfo, option) {
            // + | -----------------------------------------
            // + | handle streaming buffer
            option.stream = q;
            const { debug } = option;
            const _formatter = this;
            let _next_position = option.pos;
            let _buffer = q.buffer;
            const { from } = q;
            const _line = option.line.substring(option.pos);
            let _p, _matcher;
            const _markerInfo = option.markerInfo;
            debug && Debug.log("::- HANDLE STREAMING -::");
            try {
                if (!_bck.started) {
                    // + | ------------------------------------------------------------------------
                    // + |  move cursor in order to detect only children with pattern because buffered stream have no capture defined
                    // + | 

                    _bck.started = true;
                    //option.pos++;
                }
                ({ _p, _matcher } = _formatter.detectPatternInfo(_line, markerInfo, option, markerInfo));
            } catch (e) {
                // invalid stream tag selection 
                const cp = _markerInfo.shift();
                if (_bck.saved) {
                    _restoreState(option, _bck);
                }
                option.line = q.buffer + option.line.substring(option.pos);
                throw e;
            }
            // + | REMOVE TOP STREAM MARKER 
            let _old = option.shiftAndRestoreFrom(markerInfo, false);
            if (_old) {
                _topStreamRemoved = true;
            }
            // + | here must get the definition for the parent - to update if required
            _old = (_markerInfo.length > 0) ? option.shiftFromMarkerInfo(from, false) : null;
            if (!_bck.saved) {
                _bck.option = {
                    listener: option.appendToBufferListener
                };
                // + | Set add to buffer listener : data
                option.appendToBufferListener = (v, _marker, treat, option) => {
                    let _buffer = option.buffer;
                    const { formatting } = option.formatter;
                    const _def = {_marker, formatting} ;
                    if (treat && !q.from.formatter){
                        v = option.treatValueBeforeStoreToBuffer(_marker, v);
                    }


                    if (_buffer.length > 0) {
                        if (_buffer != option.glueValue){
                        q.appendToBuffer(_buffer, _def);
                        option.formatterBuffer.clear();
                        }
                    }
                    if (v.length > 0)
                        q.appendToBuffer(v, _def);
                    return v;
                };
                _bck.saved = true;
            }

            option.storeRange(option.pos);
            let r = null;
            const endFound = FormatterStreamBuffer.HandleStreamEndFound(q, markerInfo, _bck, _formatter, _restoreState, _restoreBackupState);
            q.endFoundListener = (_buffer, _line, patternInfo, _p, option, _old) => {
                const g = endFound(_buffer, _line, patternInfo, _p, option, _old);
                _restoreSavedBuffer(option);
                return g;
            };

            if (option.EOF && (_p == null) && (_matcher == null)) {
                return q.stopAndExitStream(markerInfo, option, _bck, _restoreState, _old);
            }
            if (option.TOEND) {
                //return q.stopAndExitStream(markerInfo, option, _bck, _restoreState, _old);

                let _ret = endFound.apply(option.formatter, [_buffer, _line, markerInfo, _p, option, _old]);

                return _ret;
            }


            try {
                if ((_old == null) && (_buffer.length > 0)) {
                    // + | just start stream buffer 
                    _buffer = '';
                }
                if (!q.marked) {
                    const _stream_old = _formatter._updateMarkerOldContentOrSwapBuffer(markerInfo, null, '', null, option);
                    q.marked = true;
                    _stream_old.endFound = endFound;
                }

                r = _formatter.handleMatchLogic({
                    _p,
                    _old,
                    _matcher,
                    _line,
                    patternInfo: from,
                    option: option,
                    _buffer,
                    endFound,
                    handleConstant(patternInfo, _line, option) {
                        if (_line.trim().length > 0) {
                            option.appendToBuffer(_line, patternInfo);
                        }
                        option.pos += _line.length;
                        if (_old) {
                            option.unshiftMarker(_old);
                            return _old.marker;
                        }
                        return markerInfo;// q.from;
                    }
                });

                if (q.closed && q.marked) {
                    option.shiftAndRestoreFrom(markerInfo, false);
                }

            } catch (e) {
                // update buffer 
                console.log("End buffer..... ", e);
                _restoreSavedBuffer(option);
                _formatter.skipFormat();
                return null;
            }
            _restoreSavedBuffer(option);
            option.stream = null;
            if (r && !(r instanceof PatternMatchInfo)) {
                throw new Error("pattern not valid");
            }
            if (!q.closed) {
                if (r === q.from) {
                    return markerInfo;
                }
            }

            return r;
        };
    }

    /**
     * 
     * @param {*} patternInfo 
     * @param {*} option 
     * @param {*} _old 
     * @param {*} markerInfo 
     * @param {*} next_position 
     * @param {*} length 
     * @param {*} _tline 
     * @returns 
     */
    moveToNextPattern(patternInfo, option, _old, markerInfo, next_position, length, _tline) {
        const { parent, hostPatterns, streamAction, indexOf } = patternInfo;
        const { lineMatcher } = option;
        lineMatcher.reset();
        lineMatcher.sourceLine = _tline || '';

        option.storeRange(option.pos);
        let _patterns = hostPatterns ?
            Utils.GetPatternsList(hostPatterns, indexOf, streamAction) : [];

        if (_patterns.length > 0) {
            // + | handle matcher to line
            let g = Utils.GetPatternMatcherInfoFromLine(option.line, _patterns, option, parent);
            if (_old) {
                if (_old?.marker == markerInfo) {
                    option.restoreBuffer(_old);
                }
            }
            if (g) {
                // + | exit from - top pattern Info 
                _old = //option.shiftFromMarkerInfo(patternInfo);
                    option.shiftAndRestoreFrom(patternInfo, false);
                return g;
            }
            // skip to next position 
            if (parent === null) {
                // + | ------------------------------------------------------------
                // + | skip and continue
                let _rindex = next_position - length;
                let _append = option.line.substring(0, _rindex);
                option.appendToBuffer(_append, option.constants.StreamLineConstant);
                option.line = option.line.substring(_rindex);
                option.pos = 0;
                return null;
            }

        }
        if (parent === null) {
            // + | just append to buffer              
            option.appendToBuffer(option.line, option.constants.StreamLineConstant);
            option.pos = option.length;
            return null;
        }
        return parent;
    }
    /**
     * get marker end buffers 
     * @param {*} q 
     * @param {*} markerInfo 
     * @param {*} _bck 
     * @param {*} _formatter 
     * @param {*} _restoreState 
     * @param {*} _restoreBackupState 
     * @returns 
     */
    static HandleStreamEndFound(q, markerInfo, _bck, _formatter, _restoreState, _restoreBackupState) {
        return (_buffer, _line, patternInfo, _p, option, _old) => {
            const { parent } = patternInfo;
            const { formatter } = option;
            const { endRegex } = markerInfo;
            q.closed = true;
            // + backup line 
            let _cpos = option.pos;

            let _cbuffer = q.buffer;
            let _nextCapture = null;
            let _next_position = 0;
            option.lineMatcher.reset()
            //option.pos = 0;
            _nextCapture = Utils.GetNextCapture(_line, endRegex, option);
            option.storeRange(option.pos);
            _next_position = _nextCapture.index + _nextCapture.offset;
            if (!_nextCapture) {
                throw new Error('missing capture');
            }
            const _end = _nextCapture[0];
            const _sline = _line.substring(0, _nextCapture.index);
            _line = _line.substring(_nextCapture.index + _end.length);
            const _gline = _cbuffer + _sline + _end;
            const _tline = FormatterStreamBuffer.GetBufferedLine(formatter,
                _gline, option, patternInfo);
            option.line = _tline + _line;
            _restoreState(option, _bck);

            // + | move buffer to parrent 
            _buffer = option.getBufferContent(true);
            _old && option.restoreBuffer(_old);
            if (_buffer.length > 0)
                option.formatterBuffer.appendToBuffer(_buffer);
            // + | unset marker option 
            formatter._onEndHandler(patternInfo, option);
            if (parent) {
                // + | end handler before handle parent
                _restoreBackupState(parent);
                const _idx = patternInfo.indexOf;
                if (_idx === -1) {
                    throw new Error('missing component. use index not valid');
                }
                // + | depend on streamAction passing to content to next|parent 
                // + | next: mean to child process
                // + | parent: to parent buffer 

                // restart on parent by removing to handle logic
                // let _patterns = Utils.GetPatternsList(patternInfo.hostPatterns, _idx, streamAction);
                // if (streamAction == 'parent') {
                //     return parent;
                // }
                // let g = Utils.GetPatternMatcherInfoFromLine(option.line, _patterns, option, parent);
                // if (g) { // continue to cp
                //     let cp = _formatter._handleMarker(g, option); 
                //     return cp;
                // }
                // move cursor 
                _cpos = _tline.length - _next_position;
                let _gbuffer = _tline.substring(0, _cpos);
                ({ _gbuffer, _cpos } = option.treatAndFormat(q, _gbuffer));
                // update stored definition and move cursor to next
                option.pos = _cpos;
                option.storeRange(option.pos);
                option.appendToBuffer(_gbuffer, option.constants.StreamBufferConstant);

                // passing children to parent
                if (parent && (patternInfo.childs.length > 0)) {
                    patternInfo.childs.forEach(a => parent.childs.push(a));
                }
                return parent;
            }
            // + | put this line to buffer and skip   
            return q.moveToNextPattern(patternInfo, option, _old, markerInfo,
                _next_position,
                _end.length, _tline);
        }
    }
    /**
     * 
     * @param {*} formatter 
     * @param {*} _src_line 
     * @param {*} option 
     * @param {*} patternInfo 
     * @returns 
     */
    static GetBufferedLine(formatter, _src_line, option, patternInfo) {
        const op = [];
        const _group = [_src_line];
        let _line = formatter.treatMarkerValue(patternInfo, _src_line, op, option, _group);
        const _captures = patternInfo.streamCaptures || patternInfo.captures;
        if (_captures) {
            _line = Utils.TreatCapture(patternInfo, _captures, _line, [], option);
        }
        return _line;
    }

    /**
     * 
     * @param {*} option 
     */
    start(option) {
        this.initialMode = option.nextMode;
    }
}

exports.FormatterStreamBuffer = FormatterStreamBuffer;
