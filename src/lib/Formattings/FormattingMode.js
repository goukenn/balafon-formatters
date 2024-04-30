"use strict";
Object.defineProperty(exports, '__esModule', {value:true});

const FM_START = 0;
const FM_APPEND = 1;
const FM_APPEND_BLOCK = 9;
const FM_START_BLOCK = 5;
const FM_END_INSTRUCTION = 3;
const FM_END_BLOCK = 6;
const FM_START_LINE = 2;
const FM_START_LINE_NEXT_LINE = 7; 
const FM_START_LINE_APPEND = 8; // start line then append 

exports.FM_APPEND = FM_APPEND;
exports.FM_START_LINE = FM_START_LINE; 
exports.FM_START_BLOCK = FM_START_BLOCK;
exports.FM_END_BLOCK = FM_END_BLOCK; 
exports.FM_START_LINE_NEXT_LINE = FM_START_LINE_NEXT_LINE; 
exports.FM_END_INSTRUCTION = FM_END_INSTRUCTION; 
exports.FM_START_LINE_APPEND = FM_START_LINE_APPEND; 
exports.FM_APPEND_BLOCK = FM_APPEND_BLOCK; 

/**
 * configured formatting mode 
 */
//require line feed on pattern
const PFM_LINE_FEED = 1;
//require join for single pattern
const PFM_LINE_JOIN_END = 2; 
// join line formatting mode 
const PFM_LINE_JOIN = 3;

// enable streaming buffer
const PFM_STREAMING = 4;


exports.PatternFormattingMode = {
    get PFM_LINE_FEED(){
        return PFM_LINE_FEED;
    },
    get PFM_LINE_JOIN_END(){
        return PFM_LINE_JOIN_END;
    },
    get PFM_LINE_JOIN(){
        return PFM_LINE_JOIN;
    },
    get PFM_STREAMING(){
        return PFM_STREAMING;
    }
};


exports.FormattingMode = {
    FM_APPEND,
    FM_START_BLOCK,
    FM_END_INSTRUCTION,
    FM_END_BLOCK,
    FM_START_LINE,
    FM_START_LINE_NEXT_LINE ,
    FM_APPEND_BLOCK,
};


exports.HandleFormatting = function(_marker, option, _old) {
        let _mode = _marker.mode;
        let _sbuffer = '';
        let _buffer = option.buffer;

        let _formatting = this.formatting;
        switch (_mode) {
            case FM_START:
                option.store();
                option.appendExtraOutput();
                _sbuffer = option.flush(true);
                _mode = FM_START_LINE;
                break;
            case FM_START_LINE:
                // store then go to append
                let _append = true;
                if (_buffer.trim().length == 0) {
                    option.formatterBuffer.clear();
                    _buffer = '';
                    _append =false;
                } else {
                    option.store(); 
                }
                _sbuffer = option.flush(true);
                if (_append && (_sbuffer.length > 0)) {
                    _mode = FM_APPEND;
                }
                break;
            case FM_APPEND:
                // + | append to buffer 
                _sbuffer = option.buffer;
                _sbuffer = option.flush(true) + _sbuffer;
                break;
            case FM_END_INSTRUCTION: 
                // + | append-flush-next-start-new-line
                _sbuffer = option.flush(true)+_buffer;  
                _mode = FM_START_LINE;
                break;
            case 4:
                // store what is on the buffer append nuew file
                option.store();
                option.appendExtraOutput();
                _sbuffer = option.flush(true);
                _mode = FM_START_LINE;

                break;
            case FM_START_BLOCK: // start block - append line before append
                if (_buffer.length>0){ 
                    option.store();   
                    _sbuffer = option.flush(true);
                    _mode = FM_APPEND;
                }
                break; 
            case FM_END_BLOCK:
                ({_sbuffer} = _formatting.handleEndBlockBuffer(_marker, _buffer, option, _old)); 
                _mode = FM_START_LINE;
                break;
            case FM_START_LINE_NEXT_LINE:
                option.store();
                _sbuffer = option.flush(true);
                if (_sbuffer.length > 0) {
                    _mode = FM_START_LINE;
                }else
                    _mode = FM_APPEND;
                break;
        }
        _marker.mode = _mode;
        return _sbuffer;
};
 
/**
 * 
 * @param {*} patternInfo 
 */
function formattingSetupPatternForBuffer(patternInfo, option){
 
} 
exports.formattingSetupPatternForBuffer = formattingSetupPatternForBuffer;


const AC_PARENT = 'parent';
const AC_NEXT = 'next';
class StreamActions{
    static get PARENT(){
        return AC_PARENT;
    }
    static get NEXT(){
        return AC_NEXT;
    }
}


exports.StreamActions = StreamActions;