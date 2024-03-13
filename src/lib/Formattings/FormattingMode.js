"use strict";
Object.defineProperty(exports, '__esModule', {value:true});

 
const FM_APPEND = 1;
const FM_START_BLOCK = 5;
const FM_END_BLOCK = 6;
const FM_START_LINE = 2;

exports.FM_APPEND = FM_APPEND;
exports.FM_START_LINE = FM_START_LINE; 
exports.FM_START_BLOCK = FM_START_BLOCK;
exports.FM_END_BLOCK = FM_END_BLOCK; 

exports.HandleFormatting = function(_marker, option, _old) {
        let _mode = _marker.mode;
        let _sbuffer = '';
        let _buffer = option.buffer;
        let _content = _old.content;
        switch (_mode) {
            case 0:
                option.store();
                option.output.push('');
                _sbuffer = option.flush(true);
                _mode = 2;
                break;
            case 2:
                // store then go to append
                if (_buffer.trim().length == 0) {
                    option.formatterBuffer.clear();
                    _buffer = '';
                } else {
                    option.store();
                    _sbuffer = option.flush(true);
                    if (_sbuffer.length > 0) {
                        _mode = 1;
                    }
                }
                break;
            case 1:
                // append to buffer 
                _sbuffer = option.buffer;
                _sbuffer = option.flush(true) + _sbuffer; // +option.buffer;
                break;
            case 3: // append-flush-next
                _sbuffer = option.buffer;
                option.output.push(_sbuffer);
                option.output.push('');
                _sbuffer = option.flush(true); 
                _mode = 2;
                break;
            case 4:
                // store what is on the buffer append nuew file
                option.store();
                option.output.push('');
                _sbuffer = option.flush(true);
                _mode = 2;

                break;
            case 5: // start block - append line before append
                if (_buffer.length>0){ 
                    option.store(); 
                    _sbuffer = option.flush(true);
                    _mode = 1;
                }
                break;
            case FM_END_BLOCK:
                option.store();
                _mode = 2;
                break;
        }

        _marker.mode = _mode;
        return _sbuffer;
};