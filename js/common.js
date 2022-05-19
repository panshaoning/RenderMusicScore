var AUDIO          = null;						 // HTML5 audio interface ID.
var AUDIOjrpid     = '';  						 // currently playing audio file.
var AUDIOid        = '';                   // currently playing audio button.
var ID = 'hai_2';
var REFRESH = null;
var QEVENTS = [];
var LASTTIME = -1;
var LAST_QUERY_MUSIC = {};
var LAST_QUERY_TEXT = {};
var CGI = [];
var TRANSPOSE = "";

var TIMEMAP =[];
var TK = null;

var vrvOptions = {
    humType           : 1,
    adjustPageHeight  : 1,
    pageWidth         : 2500,
    pageHeight        : 1000,
    spacingNonLinear  : 0.55,
    spacingSystem     : 24,
    spacingStaff      : 12,
    font              : "Leipzig",
    scale             : 40,
    pageMarginLeft    : 20,
    pageMarginRight   : 20,
    pageMarginTop     : 80,
    pageMarginBottom  : 80,
    justifyVertically : 0,
    footer            : "none",
    header            : "none",
    minLastJustification: 0.5,
    breaks            : "auto"
};

var CURRENT_PAGE = 1;
var INCIPIT_STYLE = 1;
var ORIGINAL_CLEFS = 0;
var INCLUDE_TEXT = 1;
var INCLUDE_ACCID = 1;
var CSS_TEXT = 1;
var PART_FILTER = 0;



function GetCgiParameters() {
   var url = window.location.search.substring(1);
   var output = {};
   var settings = url.split('&');
   for (var i=0; i<settings.length; i++) {
      var pair = settings[i].split('=');
      pair[0] = decodeURIComponent(pair[0]);
      pair[1] = decodeURIComponent(pair[1]);
      if (typeof output[pair[0]] === 'undefined') {
         output[pair[0]] = pair[1];
      } else if (typeof output[pair[0]] === 'string') {
         var arr = [ output[pair[0]], pair[1] ];
         output[pair[0]] = arr;
      } else {
         output[pair[0]].push(pair[1]);
      }
   }
   return output;
}



function getHumdrumContent(id) {
	var element = document.querySelector("#humdrum-data");
	//console.log('get humd content::;',element);
	if (!element) {
		return;
	}

	var text = "";
	var postdata = "";
	postdata += "\n!!!footer-right: \\n\\n\\n%P";
	postdata += "\n!!!footer-center: \\n\\n\\n@{SCA}, @{EEV}";
	postdata += "\n!!!footer-left: \\n\\n\\n@{YEC}";
	postdata += "\n!!!header-left: @{EED:n}, ed.";

	var request = new XMLHttpRequest();
	var url = '/files/'+ID+'.krn';
	request.open('GET', url);
	request.addEventListener("load", function() {
		var data = this.responseText;
		if (!data.match(/footer-center/)) {
			data += postdata;
		}
		if (element) {
			element.textContent = data;
			initializeVerovioNotation("humdrum-data");
		}
	});
	request.send()

}


function PlayAudioFile(jrpid, element, starttime) {
    // The JRPID is not the same as the currently playing file
    // (or there is no file playing).  So start the new one.
    if (!AUDIO) {
       AUDIO = document.getElementById('audio');
   }
    if (!AUDIO) {
        AUDIO = document.createElement("AUDIO");
        AUDIO.id = "audio";
        document.body.appendChild(AUDIO);
    }
   if (!AUDIO) {
        console.log('Error: could not set up audio interface\n');
        return false;
   }
    AUDIO.setAttribute('controls', 'controls');
    AUDIO.style.position = 'fixed';
    AUDIO.style.bottom = '0';
    AUDIO.style.right = '0';
    AUDIO.style.zIndex = '1';

    AUDIO.onpause = function () {
        TurnOffAllNotes();
    }

	 var audiobutton;
   if (jrpid != AUDIOjrpid) {
        if (!!AUDIOid) {
            // turn of previously playing audio file:
            audiobutton = document.getElementById(AUDIOid);
            if (!!audiobutton && !!audiobutton.className) {
                if (audiobutton.className.match(/mp3/)) {
                    audiobutton.className = 'mp3play';
                } else {
                    audiobutton.className = 'play';
                }
            }
        }
        AUDIO.removeAttribute('controls');
      AUDIO.pause();

      AUDIOid = element.id;
        var source = '';
        //source += '<source src="/verovio/1.mp3" ';
        source += '<source src="/files/'+ID+'.mp3" ';
        source += 'type="audio/mpeg"/>\n';
        AUDIO.innerHTML = source;

        AUDIOjrpid = jrpid;
        AUDIO.load();
        if (starttime) {
            AUDIO.currentTime = starttime;
        }

		AUDIO.play();
        InitializeTimemap();

        AUDIO.setAttribute('controls', 'controls');
        var newelement = document.getElementById(AUDIOid);

        AUDIO.addEventListener("ended", function() {
            newelement.className = "play";
        });

        if (newelement.className.match(/mp3/)) {
            newelement.className = 'mp3pause';
        } else {
            newelement.className = 'pause';
        }

        return;
    }

	// on its current state:
    if (AUDIO.paused) {
        audiobutton = document.getElementById(AUDIOid);
        if (!audiobutton) {
            return;
        }

        if (audiobutton.className.match(/mp3/)) {
            audiobutton.className = 'mp3play';
        } else {
            audiobutton.className = 'play';
        }
        AUDIO.play();
        InitializeTimemap();
        AUDIO.setAttribute('controls', 'controls');
    } else {
        audiobutton = document.getElementById(AUDIOid);
        if (!audiobutton) {
            return;
        }

        if (audiobutton.className.match(/mp3/)) {
            audiobutton.className = 'mp3pause';
        } else {
            audiobutton.className = 'pause';
        }
        if (element.className.match(/mp3/)) {
            element.className = 'mp3play';
        } else {
            element.className = 'play';
        }
        AUDIO.pause();
        AUDIO.removeAttribute('controls');
    }
}



function InitializeTimemap() {
	if (typeof REFRESH === "undefined") {
		return;
	}
	var increment = 20;
	console.log('QEVENTS-98000========',QEVENTS);
	REFRESH = setInterval(function() {
		if (AUDIO && AUDIO.paused) {
			clearInterval(REFRESH);
			return;
		}
		if (!AUDIO) {
			clearInterval(REFRESH);
			return;
		}
		var currenttime = AUDIO.currentTime;
		CheckTimeMap(TIMEMAP[ID], QEVENTS, currenttime, increment/1000.0 * 2);
	}, increment);
}

//

function CheckTimeMap(timemap, events, currenttime, increment) {
	var target = null;
	var diff;
	for (var i=0; i<timemap.length; i++) {
		if (Math.abs(timemap[i].tstamp - currenttime) < increment) {
			target = timemap[i];
		}
	}
	if (!target) {
		return;
	}

	if (target.tstamp == LASTTIME) {
		return;
	}
	console.log("9898",timemap,target,target.tstamp,currenttime,increment);
	LASTTIME = target.tstamp;
	CheckEventMap(target.qstamp, events);
}

function CheckEventMap(etime, events) {
	console.log('check event map----',etime, events);
	for (var i=0; i<events.length; i++) {
		if (Math.abs(etime - events[i].qstamp) < 0.01) {
			ProcessNoteEvents(events[i]);
		}
	}
}


//////////////////////////////
//
// ProcessNoteEvents --
//

function ProcessNoteEvents(event) {
	var ons = event.on;
	var offs = event.off;
	var i;

	for (i=0; i<ons.length; i++) {
		// ons[i].style.stroke = "red";
		// ons[i].style.fill = "red";
		// have to re-find on page in case the image has changed:
		var xon = document.querySelector("#" + ons[i].id);
		xon.style.fill = "red";
	}

	for (i=0; i<offs.length; i++) {
		// have to re-find on page in case the image has changed:
		var xoff = document.querySelector("#" + offs[i].id);
		xoff.style.fill = "";
	}
}


function getTimemap(id) {
	if (!id) {
		id = ID;
	}
	if (TIMEMAP[id]) {
		return;
	}
	var meiXML = $('#humdrum-data').html();
    TK.renderData(meiXML, {});

	var timemap = TK.renderToTimemap();
	console.log('sdfsadf',timemap);
	timemap.forEach(function(_t,i){
		_t.tstamp = _t.tstamp * 0.90909 / 1000 ;
	});
	TIMEMAP[id] = timemap; 
	console.log('9999my--timamap-====',TIMEMAP[id]);
	interpolateIntegers(id);
	return 

}



function interpolateIntegers(id) {
	timemap = TIMEMAP[id];
	if (timemap.length == 0) {
		return;
	}

	var newpoints = [];

	var byindex = {};

	for (var i=0; i<timemap.length; i++) {
		var qstamp = timemap[i].qstamp;
		byindex[qstamp] = {i: i, timemap: timemap[i]};
	}
	var maxval = timemap[timemap.length-1].qstamp;

	for (i=8; i<maxval; i+=8) {
		if (byindex[i]) {
			continue;
		}
		var newpoint;
		newpoint = interpolateTstamp(timemap, i);
		newpoints.push(newpoint);
		// console.log("MISSING: ", i, newpoint.tstamp);
	}

	TIMEMAP[id] = timemap.concat(newpoints);
}




function interpolateTstamp(timemap, qtime) {
	var i;
	var t1;
	var t2;
	var q1;
	var q2;
	for (i=0; i<timemap.length; i++) {
		if (timemap[i].qstamp < qtime) {
			continue;
		}
		if (i == 0) {
			console.log("STRANGE PROBLEM");
		}
		t1 = timemap[i-1].tstamp;
		t2 = timemap[i].tstamp;
		q1 = timemap[i-1].qstamp;
		q2 = timemap[i].qstamp;
		break;
	}

	if (!t2) {
			console.log("STRANGE PROBLEM 2");
	}

	var ttime = ((qtime-q1)/(q2-q1))*(t2-t1)+t1;

	var newpoint = { qstamp: qtime, tstamp: ttime};
	//console.log("NEWPOINT", newpoint);
	return newpoint;
}



function TurnOffAllNotes() {
	var list = document.querySelectorAll("svg g[id^='note-']");
	for (var i=0; i<list.length; i++) {
		list[i].style.fill = "";
	}
}


function fillInTimeKey() {
	getTimemap();
	var rows = document.querySelectorAll(".worklist tr.data");
	for (var i=0; i<rows.length; i++) {
		var idcell = rows[i].querySelector("td.id");
		var id = idcell.id;
		if (!id) {
			continue;
		}
		getTimeKey(id, rows[i]);
	}
}



//////////////////////////////
//
// getTimeKey --
//

function getTimeKey(id, row) {
	var tag = "humdrum_" + id;
	var tagcontent;
	var keysig;
	var metsig;

	var keysigcell = row.querySelector("td.keysig");
	var timecell = row.querySelector("td.time");

		/*
		var action = "humdrum";
		var url = "https://josquin.stanford.edu/cgi-bin/tasso/?a=" + action + "&id=" + id;
		var request = new XMLHttpRequest();
		request.open('GET', url);
		request.addEventListener("load", function() {
			var data = this.responseText;
			sessionStorage[tag] = data;
			keysig = getKeySig(sessionStorage[tag]);
			metsig = getMetSig(sessionStorage[tag]);
			keysigcell.innerHTML = keysig;
			timecell.innerHTML = metsig;
		});
		request.send()
		*/
		var data = getTimemap();
		console.log('data----',data[ID]);
		sessionStorage[tag] = data[ID];
		keysig = getKeySig(sessionStorage[tag]);
		metsig = getMetSig(sessionStorage[tag]);
		keysigcell.innerHTML = keysig;
		timecell.innerHTML = metsig;

}



//////////////////////////////
//
// getKeySig -- extract first key signature found in Humdrum data.
//

function getKeySig(text) {
	var matches;
	if (matches = text.match(/\*k\[(.*?)\]/)) {
		if (matches[1] == "b-") {
			return "&#x266d;"
		}
		return matches[1];
	} else {
		return "X";
	}
}



//////////////////////////////
//
// getMetSig -- extract first metric signature found in Humdrum data.
//

function getMetSig(text) {
	var matches;
	if (matches = text.match(/\*omet\((.*?)\)/)) {
		if (matches[1] === "C") {
			return "c";
		} else if (matches[1] === "C|") {
			return "c<span style='position:relative; top:2px; margin-left:-7px'>|</span>";
		} else {
			return matches[1];
		}
	} else {
		return "X";
	}
}





function incrementVerovioPage(direction) {
	CURRENT_PAGE += direction;
	var pagecount = vrvToolkit.getPageCount();
	if (CURRENT_PAGE > 1) {
		if (CURRENT_PAGE > pagecount) {
			CURRENT_PAGE = 1;
		}
	} else if (CURRENT_PAGE < 1) {
		CURRENT_PAGE = pagecount;
	}

	var target = document.querySelector("#verovio-display");
	if (!target) {
		console.log("Cannot find target id: #verovio-display");
		return;
	}

	var svg = vrvToolkit.renderToSVG(CURRENT_PAGE, vrvOptions);
	target.innerHTML = svg;

	prepareQEvents(target);
	prepareLyricSpaces(target);
}



//////////////////////////////
//
// firstVerovioPage --
//

function firstVerovioPage(direction) {
	CURRENT_PAGE = 1;
	var pagecount = vrvToolkit.getPageCount();
	if (CURRENT_PAGE > 1) {
		if (CURRENT_PAGE > pagecount) {
			CURRENT_PAGE = 1;
		}
	} else if (CURRENT_PAGE < 1) {
		CURRENT_PAGE = pagecount;
	}

	var target = document.querySelector("#verovio-display");
	if (!target) {
		console.log("Cannot find target id: #verovio-display");
		return;
	}

	var svg = vrvToolkit.renderToSVG(CURRENT_PAGE, vrvOptions);
	target.innerHTML = svg;

	prepareQEvents(target);
	prepareLyricSpaces(target);
}



//////////////////////////////
//
// lastVerovioPage --
//

function lastVerovioPage(direction) {
	CURRENT_PAGE = -1;
	var pagecount = vrvToolkit.getPageCount();
	if (CURRENT_PAGE > 1) {
		if (CURRENT_PAGE > pagecount) {
			CURRENT_PAGE = 1;
		}
	} else if (CURRENT_PAGE < 1) {
		CURRENT_PAGE = pagecount;
	}

	var target = document.querySelector("#verovio-display");
	if (!target) {
		console.log("Cannot find target id: #verovio-display");
		return;
	}

	var svg = vrvToolkit.renderToSVG(CURRENT_PAGE, vrvOptions);
	target.innerHTML = svg;

	prepareQEvents(target);
	prepareLyricSpaces(target);
}




function prepareQEvents(target) {
	if (typeof target === "string") {
		target = document.querySelector("svg");
	}

	var svgnotes = target.querySelectorAll("g[id^='note-']");
	var qpre = {};
	var matches;
	var ques;
	var obj;
	for (var i=0; i<svgnotes.length; i++) {

		if (matches = svgnotes[i].className.baseVal.match(/qon-([^\s]+)/)) {
			ques = getQstampFloat(matches[1]);
			if (!qpre[ques]) {
				qpre[ques] = {qstamp: ques, on:[], off:[]};
			}
			qpre[ques].on.push(svgnotes[i]);
		}

		if (matches = svgnotes[i].className.baseVal.match(/qoff-([^\s]+)/)) {
			ques = getQstampFloat(matches[1]);
			if (!qpre[ques]) {
				qpre[ques] = {qstamp: ques, on:[], off:[]};
			}
			qpre[ques].off.push(svgnotes[i]);
		}

	}
	QEVENTS = [];
	for (var qst in qpre) {
		QEVENTS.push(qpre[qst])
	}
	//console.log('pan----090909------',QEVENTS);
	QEVENTS.sort(function(a, b) {
		return a.qstamp - b.qstamp;
	});
}



function initializeVerovioNotation(targetid, musicquery, textquery) {

	/*
	var target = document.querySelector("#notation");
	TK.setOptions(vrvOptions);
	TK.loadData(content);
	var pagecount = TK.getPageCount();
	if (CURRENT_PAGE > 1) {
		if (CURRENT_PAGE > pagecount) {
			CURRENT_PAGE = 1;
		}
	} else if (CURRENT_PAGE < 1) {
		CURRENT_PAGE = pagecount;
	}
	var svg = TK.renderToSVG(CURRENT_PAGE);
	var matches;
	if (matches = svg.match(/height="(\d+)px"/)) {
		target.style.height = "";
	}
	target.innerHTML = svg;
	return ;
	*/

	if (!targetid) {
		targetid = "humdrum-data";
	}

	/*
	highlightPartIcon(PART_FILTER);
	displayMensurationState();
	displayTextState();
	displayAccidState();
	*/

	// Get the number of **kern and **text spines for dealing
	// with part extraction.
	var kcount = 0;
	var tcount = 0;
	var content;
	[kcount, tcount] = getHumdrumKernCount(targetid);

	if (!kcount) {
		return;
	}

	// If filters is empty, it will be deleted later.
	// vrvOptions.filter = [];
	vrvOptions.filter = generateVerovioFilters(targetid, musicquery, textquery);

	vrvOptions.pageHeight = 1000;

	if (!INCLUDE_TEXT) {
		vrvOptions.spacingStaff = 12;
	} else {
		vrvOptions.spacingStaff = 9;
	}

	if (kcount > 0) {
		vrvOptions.pageHeight = 230 * kcount + 80 * tcount;
		// target.style.height = parseInt(vrvOptions.pageHeight / 3.8 + 100 ) + "px";
	}

	if (INCIPIT_STYLE) {
		// full-page display
		vrvOptions.pageHeight = 60000;
	}

	// add header footer information to data

	if (vrvOptions.filter.length == 0) {
		// delete vrvOptions.filter;
		// The filter has to exist and be empty in order for
		// an old filter to be flushed from some cache.
		// Deleting an empty filter will not do that.
		vrvOptions.filter = "";
	} else if (vrvOptions.filter.length == 1) {
		vrvOptions.filter = vrvOptions.filter[0];
	}

	//console.log("KernCount----", kcount, "TextCount", tcount,vrvOptions);
	vrvOptions.postFunction = notationCallback;
	vrvOptions.source = targetid;

	displayHumdrum(vrvOptions);


	/*
	*/
}


function getHumdrumKernCount(humid) {
	var sourceid = humid ? humid : "humdrum-data";
	var source = document.querySelector("#" + sourceid);
	if (!source) {
		console.log("Cannot find source id:", sourceid);
		return;
	}
	var content = source.textContent;
	var matches;

	if (matches = content.match(/^(\*\*.*)/m)) {
		var tokens = matches[1].split("\t");
		var kcount = 0;
		var tcount = 0;
		for (var i=0; i<tokens.length; i++) {
			if (tokens[i] === "**kern") {
				kcount++;
			} else if (tokens[i] === "**text") {
				tcount++;
			}
		}
	}

	return [kcount, tcount];
}


///////////////////////////////
//
// generateVerovioFilters --
//

function generateVerovioFilters(targetid, musicquery, textquery) {
	var output = [];

	// Get the number of **kern and **text spines for dealing
	// with part extraction.
	var kcount = 0;
	var tcount = 0;
	var content;
	[kcount, tcount] = getHumdrumKernCount(targetid);
	console.log("KernCount", kcount, "TextCount", tcount);

	if (PART_FILTER) {
		var kval = kcount - PART_FILTER + 1;
		if (kval > 0) {
			output.push("extract -k " + kval);
			kcount = 1;
			tcount = 1;
		}
	}

	if (ORIGINAL_CLEFS) {
		output.push("modori -o");
		// previous method was to use x-path, which is now disabled in the converter:
		// vrvOptions.appXPathQuery = ["./rdg[contains(@label, 'original-clef')]"];
	} else {
		// vrvOptions.appXPathQuery = ["./rdg[contains(@label, 'asdfghjkl')]"];
	}

	if (!INCLUDE_TEXT) {
		output.push("extract -I **text");
		output.push("autobeam");
	}
	if (!INCLUDE_ACCID) {
		output.push("shed -ke 's/i/y/g'");
	}



	// Add URL parameter filter (for analysis usually):
	if (CGI.filter) {
		output.push(CGI.filter);
	}

	// Add transposition:
	if (TRANSPOSE) {
		output.push("transpose -t " + TRANSPOSE);
	}

	return output;
}

function hideLoding(){
	var  la = document.querySelector(".loading");
	la.style.display = "none";
}

function notationCallback(id) {
	console.log('notationCallback')
	hideLoding();
	fillInTimeKey();
	prepareQEvents(id);
	addFootnotes(id);
	return;
	/*
	prepareLyricSpaces(id);
	processCssTextState();
	processMatches();
	*/
}



//////////////////////////////
//
// addFootnote -- Add a marker to verovio notation (created with --hum-type option from
//     Humdrum data) and a pop-up text message for a footnote attached to the marker.
//
// Arguments::
//	options == a list of options for controlling the footer display.
//      svg == an optional svg element for which to place the footnotes.
//
// The options argument parameters:
//	options.measureStart == the starting measure of the footnotes.  This is where
//                    the text marker will be added to the notation.
//      options.measureStop == the ending measure for the footnote.  Measures between
//                    the start and stop measure will be highlighted when the mouse
//                    is moved over the text marker for the footnote.
//      options.markText == The text to display in the notation to indicate a footnote exists.
//                    If undefined, then "*" will be the text marker.
//      options.color == The color of the text marker, and the highlighting color for the
//                    measure selection for the footnote.
//      options.text  == The text to display in the popup when mousing over the marker.
//      options.svgSelector == If the svg argument is undefined, then use the given
//                    selector to find the SVG image to process.  If both the svg argument
//                    and options.svgSelector are undefined, then the selector will be "svg".
//      options.placement == this can be "above" for above the system, and "below"
//                    for below the system (but "below" is not implemented yet).  Maybe
//                    also allow placing on a specific staff in the future, and perhaps
//                    at a given beat.
//      options.className == the HTML class to indicate a footnote (to control styling with
//                    CSS).  The default class is "footnote".
//

function addFootnote(options, svg) {
console.log("ENTERING ADD FOOTNOTE", arguments);
	// locate SVG image to apply footnote to:
	let svgselector = options.svgSelector;
	if (!svg) {
		if (!svgselector) {
			svg = document.querySelector("svg");
		} else {
			svg = document.querySelector(svgselector);
		}
	}
	if (!svg) {
		return;
	}

	// Prepare parameters from options:
	let measure = options.measureStart;
	if (measure < 0) {
		return;
	}
	let endmeasure = options.measureStop;
	let measureString = "" + measure;
	if (endmeasure > measure) {
		measureString += "-" + endmeasure;
	}
	let color = options.color;
	if (!color) {
		color = "darkorange";
	}
	let infotext = options.text;
	if (!infotext) {
		infotext = "";
	}
	let marktext = options.markText;
	if (!marktext) {
		marktext = "*";
	}
	let classname = options.className;
	if (!classname) {
		classname = "footnote";
	}
	let placement = options.placement;
	if (!placement) {
		placement = "above";
	}


	// Select the measure that the footnote will be attached to:
	let mclass = "m-" + measure;
	emeasure = svg.querySelector("." + mclass);
	if (!emeasure) {
		console.log("Cannot find measure", mclass);
		return;
	}

	// Get the bounding box to locate where the footnote will be placed:
	let bbox = emeasure.getBBox();
	let textx = bbox.x;
	let texty = bbox.y;
	if (placement === "below") {
		// Allow placing below measure in the future.
		// texty = texty + bbox.height;
	}

	let prev = emeasure.previousElementSibling;
	let etype = "";
	if (prev) {
		etype = prev.nodeName;
	}
	let textnode;
	let tspan;
	if (etype.match(/text/i)) {
		textnode = prev;
	} else {
		textnode = document.createElementNS("http://www.w3.org/2000/svg", "text");
		emeasure.parentNode.insertBefore(textnode, emeasure);
		textnode.setAttribute("class", classname);
		textnode.setAttribute("x", textx);
		textnode.setAttribute("y", texty);
		textnode.setAttribute("font-size", "500px");
		textnode.setAttribute("font-weight", "bold");
		textnode.style.cursor = "help";
	}

	console.error("ADDING FOOTNOTES HERE");
	// Add footer content in #footer area
	let footerdiv = document.createElement("DIV");
	footerdiv.style.position = "absolute";
	footerdiv.style.display = "none";
	footerdiv.classList.add("tooltip");
	footerdiv.dataset.contents = infotext;
	footerdiv.innerHTML = infotext;
	let footnotes = document.querySelector("#footnotes");
console.error("*************** FOOTNOTES", footnotes);
	if (footnotes) {
console.error("ADDING FOOTNOTES TO #FOOTNOTE ==================================");
		footnotes.appendChild(footerdiv);
	}

	console.error("ADDING TSPAN");
	// Add a tspan in SVG with the infotext contents as a title:
	tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
	tspan.setAttribute("onmouseenter", "highlightMeasure(event, '" + measureString + "', '" + color + "')");
	tspan.setAttribute("onmouseout", "unhighlightMeasure(event, '" + measureString + "')");
	tspan.style.fill = color;
	textnode.appendChild(tspan);
	let contents = document.createTextNode(marktext);
	tspan.appendChild(contents);
	// let etitle = document.createElementNS("http://www.w3.org/2000/svg", "title");
	// tspan.appendChild(etitle);
	// let titletext = document.createTextNode(infotext);
	// etitle.appendChild(titletext);
}



//////////////////////////////
//
// highlightMeasure --
//

function highlightMeasure(event, measure, color, suppress) {
	if (!color) {
		color = "darkorange";
	}

	if (!suppress) {
		showEmendationTooltip(event, 0);
	}

	let matches;
	let startMeasure = -1;
	let endMeasure = -1;
	if (typeof measure === "string") {
		matches = measure.match(/(\d+)-(\d+)/);
		if (matches) {
			startMeasure = parseInt(matches[1]);
			endMeasure = parseInt(matches[2]);
		} else {
			matches = measure.match(/(\d+)/);
			if (matches) {
				startMeasure = parseInt(matches[1]);
			}
		}
	} else if (typeof measure === "number") {
		startMeasure = parseInt(measure);
	}
	if (startMeasure < 0) {
		console.log("Error: measure", measure, "is not valid");
		return;
	}

	if (endMeasure < startMeasure) {
		endMeasure = startMeasure;
	}

	let svg = document.querySelector("svg");
	if (!svg) {
		return;
	}

	let i;
	for (i=startMeasure; i<=endMeasure; i++) {
		let mclass = "m-" + i;
		emeasure = svg.querySelector("." + mclass);
		if (!emeasure) {
			continue;
		}
		if (color === "currentColor") {
			emeasure.style.fill = "";
			emeasure.style.stroke = "";
		} else {
			emeasure.style.fill = color;
			emeasure.style.stroke = color;
		}
		emeasure.setAttribute("color", color);
	}
}



//////////////////////////////
//
// unhighlightMeasure --
//

function unhighlightMeasure(event, measure) {
	highlightMeasure(event, measure, "currentColor", 1);
	hideEmendationTooltip(event, 0);
}



function addFootnotes(id) {
	console.log('addFootnotes-------',id);

	// clear list of old foot notes
	let footnotes = document.querySelector("#footnotes");
	if (footnotes) {
		footnotes.innerHTML = "";
	} else {
		console.log("CANNOT FIND #FOOTNOTES");
	}

	let svg = document.querySelector("#" + id + "-container svg");
	if (!svg) {
		console.log("CANNOT FIND SVG IMAGE");
		return;
	}

	let emendations = getEmendationsForFootnotes();
	if (!emendations) {
		console.log("CANNOT FIND EMENDATIONS");
		return;
	}
console.error("EMENDATIONS", emendations);

	for (let i=0; i<emendations.length; i++) {
		emendations[i].markText = "*";
		emendations[i].color = "chocolate";
		emendations[i].placement = "above";
console.error("ADDING EMENDATION", i, emendations[i]);
		addFootnote(emendations[i], svg, "tooltip");
		// addFootnote(emendations[i], `footnote-${i}-${id}}`, svg);
	}
}


function getQstampFloat(str) {
	var ques = -1;
	if (str.match(/d/)) {
		ques = parseFloat(str.replace(/d/, "."));
	} else if (str.match(/_/)) {
		var matches = str.match(/(\d+)_(\d+)/);
		if (matches) {
			ques = parseInt(matches[1]) / parseInt(matches[2]);
		}
	} else if (str.match(/^\d+$/)) {
		ques = parseInt(str);
	}
	return ques;
}


