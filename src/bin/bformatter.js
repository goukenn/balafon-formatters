#!/usr/bin/env node

"use strict";
Object.defineProperty(exports, '__esModule', {value:true});
const { bcommander, program } = require('bcommander');
const { Formatters } = require('../lib/Formatters')
const fs = require('fs');
const path = require('path');
const PWD = process.env.PWD;

function _load_config(){

const config = (()=>{ 
    let _ret = null;
    ['js','json'].forEach(type=>{
        if (_ret) return; 
        let mfile = 'bformatter.config.'+type;
       if ( fs.existsSync(mfile)){
            // priority to file exists 
            if (type == 'js'){
                _ret = require(path.join(__dirname, mfile));
            }
            else if (type == 'json'){
                let js_data = fs.readFileSync(mfile);
                let _data = JSON.parse(js_data);
                if (_data){
                    _ret = {
                        config(){
                            return _data;
                        }
                    };
                }
            }
       }
    });
    
    return _ret; 
    })();
    return config;
}


const _commands = [{
    "name":"--bcss:build [file...]",
    "description":"build bcss files",
    "options":{
        "--output <dir>|-o <dir>":"setup output directory",
        "--filename":"change file name"
    },
    action(file){
        console.log('build sample')
    }
},{
    name:"--bcss:format [...file]",
    action(file){
        const _cfile = path.join(PWD, file); 
        if (fs.existsSync(_cfile)){
            const data = `${fs.readFileSync(_cfile)}`;
            const _formatter = Formatters.Load('bcss');
            let j = _formatter.format(data);
            console.log(j);
        } else {
            throw new Error('missing file');
        }
    }
} 
];

program.option('--config <file>','set config files');

// handle command
bcommander.Handle(_commands, process.argv);