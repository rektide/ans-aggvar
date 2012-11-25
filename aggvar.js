var glob= require("glob"),
  Q= require("q"),
  fs= require("fs")

var glob= Q.nbind(glob),
  readFile= Q.nbind(fs.readFile)

var vars= {},
  result= {}

for(var i in process.argv){
	var arg= process.argv[i],
	  frags= arg.split("=")
	if(frags.length == 1)
		continue
	vars[frags[0]] = frags.splice(1).join("=")
}

if(!vars.yaml && !vars.json){
	console.log('{"changed":false}')
	return
}

var promises= []

if(vars.yaml){
        var yamls= vars.yaml.split(",")
	for(var i in yamls){
		var processed= glob(yamls[i]).then(function(yamlFilename){
			return readFile(yamlFilename)
		}).then(function(yamlContents){
			return yaml.eval(yamlContents)
		})
		promises.push(processed)
	}
}

function addAll(arr){
	return Q.all(arr).then(function(arr){
		
	})
}

if(vars.json){
	var jsons= vars.json.split(",")
	for(var i in jsons){
		var globs= glob(jsons[i])
		.then(function(jsonFilenames){
			console.log("FILE",jsonFilenames)
			var evalled= []
			for(var j in jsonFilenames){
				var filename= jsonFilenames[j],
				  evalPromise= readFile(filename,"utf-8")
				.then(function(jsonContents){
					console.log("CONTENT",jsonContents)
					return JSON.parse(jsonContents)
				})
				evalled.push(evalPromise)
			}
			return Q.all(evalled)
			//return evalled
		})
		promises.push(globs)
	}
}

Q.all(promises).then(function(objs){
	console.log("HI",arguments,objs)
},function(err){
	console.error("NO GOOD",arguments)
})
