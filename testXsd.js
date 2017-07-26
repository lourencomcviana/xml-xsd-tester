var xsd = require('libxml-xsd');
var fs = require('fs');
var Box = require("cli-box");

var encoding='UTF-8';

//read config file
readFile(mainAppName()+'.json').then(function(files){
    try{
      let configJson=JSON.parse(files);
      try{
        validateConfigJson(configJson);
        start(configJson);
      }catch(e){
         console.log(errorStr(e));
      }
    }catch(e){
      console.error(errorStr('Could not parse '+mainAppName()+'.json'+ 'to json'));
      console.log(errorStr(e));
    }
    
  },function(err){
    if(err.errno==-2){
      console.log('config file not found, tryng to generate one for you')
      writeFile(mainAppName()+'.json',genConfigModel()).then(function(){
        console.log('create a sample "'+mainAppName()+'.json" inside, chose your own xml/xsd paths');
      },function(err){
        console.log('Could not gen "'+mainAppName()+'.json". The app may not have permission on the file system');
        console.log('you can gen your on file manually, just create it with "'+mainAppName()+'.json" and write something like this sample');
        console.log(genConfigModel());
        console.log('error')
        console.log(err);
      });
    }else{
      console.log(err);
    }
});

function start(files){

  Promise.all(genFileReadingPromisses(files)).then(
    //leitura dos arquivos ------------------------------------------------------------
    function(data){
      
      let idOrigin=0;
      let validatePromisses=[];
      for(let i=0;i<data.length;i=i+2){
        let doc=data[i];
        let schema=data[i+1];
        //constroi promessas para validação de schema
        validatePromisses.push(validate(schema,doc));
      }
      return  Promise.all(validatePromisses);

      //Promisse de validação
      function validate(schema,doc){
        return new Promise(function (fulfill, reject){
          schema.validate(doc, function (err, validationErrors){
            if (err) reject(err);
            else fulfill({doc:doc,validationErrors:validationErrors});
          });
        });
      }
    },  
    function(err){
      console.log( "\x1b[31m",'erro não tratado na leitura do arquivo',"\x1b[0m")
      console.log( "\x1b[31m",err,"\x1b[0m")
  }).then( 
    //validação dos arquivos ----------------------------------------------------------
    function(validacoes){
      //lsita resultado das validações
      for(var id in validacoes){
        if(validacoes[id].validationErrors){
          var text=
            "\x1b[31m"+'Erro!'+
            "\x1b[34m"+files[id].xml+
            "\x1b[33m"+'  >  '+
            "\x1b[34m"+files[id].xsd+
            "\x1b[0m";
          text+='\n'+"\x1b[31m"+validacoes[id].validationErrors+"\x1b[0m";
          console.log(asciiBox(text));
      
        }else{
          console.log("\x1b[32m",'Sucesso!',
            "\x1b[34m",files[id].xml,
            "\x1b[33m",'>',
            "\x1b[34m",files[id].xsd,
            "\x1b[0m");
        }
      }
    },
    function(err){
      console.log( "\x1b[31m",'erro não tratado na validação',"\x1b[0m");
      console.log( "\x1b[31m",err,"\x1b[0m");
  });

}
function genFileReadingPromisses(files){
  let promisses=[];
  let filesToLoad={};

  let readMethods={
    xml:readFile,
    xsd:parseFile
  }
  
  for(let id in files){
    //gera ou reaproveita promessas de acordo com os arquivos sendo carregados
    for(let type in files[id]){
      if(!filesToLoad[files[id][type]]){
        filesToLoad[files[id][type]]=readMethods[type](files[id][type]);
      }
      promisses.push(filesToLoad[files[id][type]]);
    }
  }
  return promisses;

  function parseFile(filename){
    return new Promise(function (fulfill, reject){
      xsd.parseFile(filename, function(err, res){
        if (err) reject(err);
        else fulfill(res);
      });
    });
  }
}

function readFile(filename){
  return new Promise(function (fulfill, reject){
    fs.readFile(filename, encoding, function (err, res){
      if (err) reject(err);
      else fulfill(res);
    });
  });
}

function writeFile(filename,content){
  return new Promise(function (fulfill, reject){
    fs.writeFile(filename, content, function (err){
      if (err) reject(err);
      else fulfill(filename);
    });
  });
}


function tryParseJSON (jsonString){
    try {
        var o = JSON.parse(jsonString);

        // Handle non-exception-throwing cases:
        // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
        // but... JSON.parse(null) returns null, and typeof null === "object", 
        // so we must check for that, too. Thankfully, null is falsey, so this suffices:
        if (o && typeof o === "object") {
            return o;
        }
    }
    catch (e) { }

    return false;
};


// So pra fazer o erro ficar bonito =)
function asciiBox(text){
  var box = Box("0x0", 
  {
    vAlign: "top",
    hAlign: "left",
    text:text.trim(),
    stretch: true,
    autoEOL:true
  });
  return box.toString();
}

function genConfigModel(){
  return JSON.stringify(
  [
    {
      xml:'relative/dir/docXml.xml',
      xsd:'relative/dir/docXsd.xsd'
    },
    {
      xml:'/absolute/dir/AnotherDocXml.xml',
      xsd:'/absolute/dir/AnotherDocXsd.xsd'
    }
  ]
  ,null,2)
}
function validateConfigJson(configJson){
  if(configJson.length==0){
    throw 'list is empty'
  }
  for(var id in configJson){
    if(!configJson[id].xsd || !configJson[id].xml){
      throw 'the item does not have an xml and xsd file reference'
        +'\nItem number:'+id
        +'\nvalue found:'+JSON.stringify(configJson[id])
    }
  }
  return true;
}

function errorStr(text){
  return '\x1b[31m'+text+'\x1b[0m'
}
function mainAppName(){
  let list=process.argv[1].split(/[\\/]/);
  return list[list.length-1].split('.')[0];
}
