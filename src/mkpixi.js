#!/usr/bin/node
"use strict";
var child_process = require("child_process");
process.chdir(__dirname + "/core")
child_process.execFile("find", [".", "-type", "f"], function(err, stdout, stderr){
	var files = stdout.split("\n");
	files.pop();
	files.forEach(function(path, i){
		files[i] = path.slice(2);
	});
	files.splice(0, 0, "../pixi.js");
	child_process.execFile("mkcjs", files, function(err, stdout, stderr){
		if (stdout || stderr) console.log(stdout, stderr);
		child_process.execFile("uglifyjs", ["../pixi.js", "--screw-ie8", "-mco", "../pixi.min.js"], function(err, stdout, stderr){
			if (stdout || stderr)  console.log(stdout, stderr);
			process.exit();
		});
	});
});