
const si = require('systeminformation');
var os = require('os');
cpuCount = os.cpus().length;



console.log("os.cpus()", os.cpus());
console.log("os.cpus()", os.cpus().length);


si.cpu()
    .then(data => {
        console.log('CPU Information:--------------------------------');
        console.log('- manufucturer: ' + data.manufacturer);
        console.log('- brand: ' + data.brand);
        console.log('- speed: ' + data.speed);
        console.log('- cores: ' + data.cores);
        console.log('- physical cores: ' + data.physicalCores);
        //console.log('- virtual cores: ' + data.);
        console.log('...');
    })
    .catch(error => console.error(error));