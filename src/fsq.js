//Puts fs asyn operations inside Promises
(function() {
  var fs = require('fs');

  module.exports = {
    readFile:readFile,
    writeFile:writeFile
  };
  var defaultEncoding='UTF-8';

  function readFile(filename,encoding){
    if(!encoding) encoding=defaultEncoding;
    return new Promise(function (fulfill, reject){
      fs.readFile(filename, encoding, function (err, res){
        if (err) reject(err);
        else fulfill(res);
      });
    });
  }

  function writeFile(filename,content,encoding){
    if(!encoding) encoding=defaultEncoding;
    return new Promise(function (fulfill, reject){
      fs.writeFile(filename, content,encoding, function (err){
        if (err) reject(err);
        else fulfill(filename);
      });
    });
  }
  
}());