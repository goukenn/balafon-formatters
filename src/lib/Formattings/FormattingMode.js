"use strict";
Object.defineProperty(exports, '__esModule', {value:true});

const FM_START = 0;
const FM_APPEND = 1;
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

/**
 * configured formatting mode 
 */
//require line feed on pattern
const PFM_LINE_FEED = 1;
//require join for single pattern
const PFM_LINE_JOIN_END = 2; 

exports.PatternFormattingMode = {
    get PFM_LINE_FEED(){
        return PFM_LINE_FEED;
    },
    get PFM_LINE_JOIN_END(){
        return PFM_LINE_JOIN_END;
    }
};


exports.FormattingMode = {
    FM_APPEND,
    FM_START_BLOCK,
    FM_END_INSTRUCTION: FM_END_INSTRUCTION,
    FM_END_BLOCK,
    FM_START_LINE,
    FM_START_LINE_NEXT_LINE 
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
 * use to update the current buffer depending on the formatting mode
 * @param {string} data 
 * @param {number} mode 
 * @param {*} _marker 
 * @param {*} option 
 */
function updateBuffer(data, mode, _marker, option){
    // just append data to buffer depenting on case 
    switch(mode){
        case FM_START_LINE:
        case FM_END_BLOCK:
            data = data.trimStart();
            let _buffer = option.buffer;
            if (_buffer.length > 0) {
                option.output.push(_buffer); // append line 
                option.formatterBuffer.clear();
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
            if (data.length>0){
                option.appendToBuffer(data, _marker);
                mode = FM_APPEND;  
            }
            break;
        case FM_END_INSTRUCTION:
            data = data.trimStart();
            if (data.length>0){
                option.appendToBuffer(data, _marker);
                mode = FM_APPEND;  
            } 
            break;
        case FM_START_LINE_APPEND:
            // TODO : update buffer not handled
            data = data.trimStart();
            if (data.length>0){
                option.appendToBuffer(data, _marker);
                option.store();
                mode = FM_APPEND;  
            } 
            break;
        default:
            throw new Error('update Buffer not handled : '+mode); 
    }
    _marker.mode = mode;
};

/**
 * 
 * @param {*} patternInfo 
 */
function formattingSetupPatternForBuffer(patternInfo, option){
 
}
exports.updateBuffer = updateBuffer;
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