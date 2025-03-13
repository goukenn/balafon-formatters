const fs = require('fs')
const path = require('path')

const dest = './dist'; 
let list = ['bformatter', 'extension'];
const cdir = {};

list.forEach((dir)=>{
    let d = dest+"/"+dir;
    let m = fs.readdirSync(d);
    m.forEach((t)=>{
        let i = d+"/"+t;
       if ( /\.DS_Store/i.test(t)){
            console.log("unlink ")
            fs.unlinkSync(i);
            return;
        }
        let o = `./bck/${dir}/${t}`;
        console.log('move '+i+' => '+o);
        let gdir = path.dirname(o);
        if (!cdir[gdir]){
            if (!fs.existsSync(gdir)){
                fs.mkdirSync(gdir, {recursive:true});
            }
            cdir[gdir] = 1;
        }
        fs.renameSync(i, o);
    });
});


console.log('done');