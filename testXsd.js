(function() {
  var main = require("./src/main");

  console.log(process.argv[1]);
  main
    .readConfigFile(thisName()+'.json')
    .then(function(configJson){
      main.validateFiles(configJson);
    },function(err){
      console.log(err)
    });



  function thisName(){
    let list=process.argv[1].split(/[\\/]/);
    return list[list.length-1].split('.')[0];
  }
}());