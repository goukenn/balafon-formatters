"use stricts";

const { Formatters } = require("../src/lib/Formatters");
const webUtils = require("../src/web/Utils");
 
// const _formatter = Formatters.Load('format-only', webUtils.webStyleClass);
const _formatter = Formatters.Load('bcss', webUtils.webStyleClass);
const _def = {};
_formatter.debug = true;
_formatter.listener = null;
// _formatter.listener = webUtils.webFormattingListener(_def);
let src = `# default-media sm
@def{  
    body .p +
b\\:hover{
        display: none;
        min-width:100px;
        p{
            color:red;
            display: block;
            local{
                color:yellow;
            }
        }
    }
    info{
        color:red;
    }
}
@sm-screen{
    body{
        background-color:red;
    }
    p[type=info]:visited:not(.sample){
        color:yellow;
    }
}`;
src = `
@def

{
    doaction{ 
color     :    red;  local{ data: true;}
}
}
@def{info{content:''; local:info; presentation:some}}`;
const g = src.split("\n");
// const g = [
//     "# default-media sm ",    
//     "@xxsm-screen{",
//     "   ",
//     "}",
//     "@def{}"
// ];

const data = _formatter.format(g);


console.log("result: ");
console.log(data);
console.log(':--done--:');
