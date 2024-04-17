"use strict";

Object.defineProperty(exports, '__esModule', { value: true });
const { FormattingCodeStyles } = require('./FormattingCodeStyles');
const { FormattingBase } = require('./Formattings/FormattingBase');
const { TransformEngine } = require('./TransformEngine');

class FormatterSetting {
    tabStop = "\t";
    lineFeed = "\n";
    blockOnSingleLine = true;
    noSpaceJoin = false;
    codingStyle = FormattingCodeStyles.K_R;
    /**
     * use source indent
     * @var {boolean} 
     */
    useIndent = false;
    depth = 0;
    line = 0;
    /**
     * depending on lanuage instruction separator can be a value 
     */
    instructionSeparator = ';';
    /**
     * by default use the current  formatter instance
     */
    useCurrentFormatterInstance = true;

    /**
     * setup engine used to transform tokenID or captured expression - setting
     * @var {?TransformEngine}
     */
    transformEngine

    /**
     * 
     * @param {*} parser
     * @param {*} fieldname
     * @param {*} data 
     * @param {*} refKey 
     * @param {*} refObj 
     */
    json_parse(parser, fieldname, data, refKey, refObj) {
        switch (fieldname) {
            case 'codingStyle':
                if (FormattingCodeStyles.Support(data)) {
                    return data;
                }
                throw new Error(fieldname + ' not supported');
            case 'transformEngine': 
                let engine = null;
                if (data instanceof TransformEngine){
                    engine = data;
                }
                if (typeof(data) == 'string'){
                    engine = TransformEngine.CreateEngine(data);
                } else {
                    const {id, engine} = data;
                    // init transform engine 
                    engine = TransformEngine.CreateEngine(data);
                } 
                return engine;
        }
        return data;
    }
    /**
     * get code style formattings
     * @returns 
     */
    getCodingStyleFormatting() {
        return FormattingBase.Factory(this.codingStyle);
    }
    /**
     * 
     * @param {*} ch 
     * @returns 
     */
    isInstructionSeperator(ch) {
        let g = this.instructionSeparator;
        if (typeof (g) == 'string') {
            g = g.split('|');
        }
        return g.indexOf(ch) != -1;

    }
}
exports.FormatterSetting = FormatterSetting;