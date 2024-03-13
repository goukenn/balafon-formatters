"use strict";

Object.defineProperty(exports, '__esModule', {value:true});
const { FormattingCodeStyles } = require('./FormattingCodeStyles');
const { FormattingBase } = require('./Formattings/FormattingBase');

class FormatterSetting{
    tabStop = "\t";
    lineFeed = "\n";
    blockOnSingleLine = true;
    noSpaceJoin= false;
    codingStyle = FormattingCodeStyles.K_R;
    depth =0;
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
     * setup engine used to transform tokenID or captured expression
     */
    transformEngine

    /**
     * 
     * @param {*} d 
     * @param {*} n 
     * @param {*} parser 
     */
    json_parse(parser, fielname, data, refKey, refObj){
        if (fielname == 'codingStyle'){
            if (FormattingCodeStyles.Support(data)){
                return data;
            }else {
                throw new Error('condingStyles not supported');
            }
        }
        return data;
    }
    /**
     * get code style formattings
     * @returns 
     */
    getCodingStyleFormatting(){
        return FormattingBase.Factory(this.codingStyle);
    }
    /**
     * 
     * @param {*} ch 
     * @returns 
     */
    isInstructionSeperator(ch){
        let g = this.instructionSeparator; 
        if (typeof(g) =='string'){
            g = g.split('|');
        }
        return g.indexOf(ch) != -1;

    }
}
exports.FormatterSetting = FormatterSetting;