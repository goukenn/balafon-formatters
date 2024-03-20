"use strict";
Object.defineProperty(exports, '__esModule', {value:true});

 
const FM_APPEND = 1;
const FM_START_BLOCK = 5;
const FM_END_INSTUCTION = 3;
const FM_END_BLOCK = 6;
const FM_START_LINE = 2;
const FM_START_LINE_AND_APPEND = 7;

exports.FM_APPEND = FM_APPEND;
exports.FM_START_LINE = FM_START_LINE; 
exports.FM_START_BLOCK = FM_START_BLOCK;
exports.FM_END_BLOCK = FM_END_BLOCK; 
exports.FM_START_LINE_AND_APPEND = FM_START_LINE_AND_APPEND; 
exports.FM_END_INSTUCTION = FM_END_INSTUCTION; 


exports.HandleFormatting = function(_marker, option, _old) {
        let _mode = _marker.mode;
        let _sbuffer = '';
        let _buffer = option.buffer;
        let _content = _old.content;
        let _formatting = this.formatting;
        switch (_mode) {
            case 0:
                option.store();
                option.appendExtaOutput();
                _sbuffer = option.flush(true);
                _mode = FM_START_LINE;
                break;
            case FM_START_LINE:
                // store then go to append
                if (_buffer.trim().length == 0) {
                    option.formatterBuffer.clear();
                    _buffer = '';
                } else {
                    option.store();
                    _sbuffer = option.flush(true);
                    if (_sbuffer.length > 0) {
                        _mode = FM_APPEND;
                    }
                }
                break;
            case 1:
                // append to buffer 
                _sbuffer = option.buffer;
                _sbuffer = option.flush(true) + _sbuffer; // +option.buffer;
                break;
            case FM_END_INSTUCTION: // append-flush-next
                _sbuffer = option.buffer;
                option.output.push(_sbuffer);
                option.appendExtaOutput();
                _sbuffer = option.flush(true); 
                _mode = FM_START_LINE;
                break;
            case 4:
                // store what is on the buffer append nuew file
                option.store();
                option.appendExtaOutput();
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
                _mode = 2;
                break;
            case FM_START_LINE_AND_APPEND:
                option.store();
                option.appendExtaOutput();
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
    switch(mode){
        case FM_START_LINE:
            data = data.trimStart();
            let _buffer = option.buffer;
            if (_buffer.length > 0) {
                option.output.push(_buffer); // append line 
                option.formatterBuffer.clear();
            }
            option.appendToBuffer(data, _marker);
            //option.store();
            _marker.mode = FM_APPEND;
            break;
        case FM_APPEND:
            option.appendToBuffer(data, _marker);
        break;
        default:
            throw new Error('update Buffer not handled : '+mode); 
    }
};
exports.updateBuffer = updateBuffer;