"use strict";

Object.defineProperty(exports, '__esModule', {value:true});

class FormatterSetting{
    tabStop = "\t";
    lineFeed = "\n";
    blockOnSingleLine = true;
    noSpaceJoin= false;
    depth =0;
    line = 0;
    /**
     * by default use the current  formatter instance
     */
    useCurrentFormatterInstance = true;
}
exports.FormatterSetting = FormatterSetting;