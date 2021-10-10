const FIELD_LENGTH = 160;
const FIELD_WIDTH = 84;
const DRAW_SCALE_FACTOR = 10;

const BACK_SIDELINE = 0;
const BACK_HASH = 1;
const FRONT_HASH = 2;
const FRONT_SIDELINE = 3;

var drill;
var drawing = true;

var stepMode = false;
var stepCurrent = 0;

var dotBookMode = false;

var sliderCount = 1;

var showMode = false;
var playMode = false;
var playManager;

var isFieldDrawn = false;
var canvasField;

function setup() {
    var canvas = createCanvas(FIELD_LENGTH * DRAW_SCALE_FACTOR, FIELD_WIDTH * DRAW_SCALE_FACTOR);
    canvas.parent('football-field');
    drill = new Drill();
    playManager = new PlayManager();
    canvasField = createGraphics(FIELD_LENGTH * DRAW_SCALE_FACTOR, FIELD_WIDTH * DRAW_SCALE_FACTOR);
}
function draw() {
    if (!drawing) return;
    clear();
    if (!isFieldDrawn) {
        drawField();
        isFieldDrawn = true;
    }
    image(canvasField, 0, 0);
    if (!showMode) drill.show();
    else playManager.show();
    if (dotBookMode) MakeDotBook();
    drawing = false;
    if (showMode && playMode) playManager.Update();
}
function drawField() {
    canvasField.stroke(255, 0, 0);
    canvasField.strokeWeight(1);
    canvasField.rect(1, 1, FIELD_LENGTH * DRAW_SCALE_FACTOR - 2, FIELD_WIDTH * DRAW_SCALE_FACTOR - 2);
    canvasField.fill(255);
    for (var x = 0; x < FIELD_LENGTH + 1; x++) {
        for (var y = 0; y < FIELD_WIDTH + 1; y++) {

            canvasField.stroke(192, 192, 192);
            canvasField.strokeWeight(1);

            //Horizontal gridlines
            if (y % 4 == 0) {
                canvasField.stroke(127, 127, 255);
            }
            canvasField.line(0 * DRAW_SCALE_FACTOR, y * DRAW_SCALE_FACTOR, FIELD_LENGTH * DRAW_SCALE_FACTOR, y * DRAW_SCALE_FACTOR);

            canvasField.stroke(192, 192, 192);
            canvasField.strokeWeight(1);

            //Vertical gridlines
            if (x % 4 == 0) {
                canvasField.stroke(127, 127, 255);
            }
            if (x % 8 == 0) {
                canvasField.stroke(0, 0, 0);
                //strokeWeight(4);
            }
            canvasField.line(x * DRAW_SCALE_FACTOR, 0 * DRAW_SCALE_FACTOR, x * DRAW_SCALE_FACTOR, FIELD_WIDTH * DRAW_SCALE_FACTOR);
        }
    }

    for (var x = 0; x < FIELD_LENGTH + 1; x++) {
        for (var y = 0; y < FIELD_WIDTH + 1; y++) {
            canvasField.stroke(192, 192, 192);
            canvasField.strokeWeight(1);

            //Hashes
            if (x % 8 == 0 && (y == 32 || y == 52)) {
                canvasField.stroke(0, 0, 0);
                canvasField.strokeWeight(4);
                canvasField.line((x - 1) * DRAW_SCALE_FACTOR, y * DRAW_SCALE_FACTOR, (x + 1) * DRAW_SCALE_FACTOR, y * DRAW_SCALE_FACTOR);
            }

            canvasField.stroke(192, 192, 192);
            canvasField.strokeWeight(1);

            //Inserts
            if (y == 0 || y == FIELD_WIDTH) {
                for (var j = x * DRAW_SCALE_FACTOR; j < (x + 1) * DRAW_SCALE_FACTOR; j++) {
                    if (j % Math.floor((8 / 5) * DRAW_SCALE_FACTOR) == 0) {
                        canvasField.stroke(0, 0, 0);
                        canvasField.strokeWeight(2);
                        canvasField.line(j, (y - 1) * DRAW_SCALE_FACTOR, j, (y + 1) * DRAW_SCALE_FACTOR);
                    }
                }
            }

            //Yard numbers
            if (x % 8 == 0 && x != 0 && x != FIELD_LENGTH) {
                var numLine = x / 8;
                var yardNumber = -Math.abs(numLine - 10) + 10;

                //Away from audience
                canvasField.textSize(4.4 * DRAW_SCALE_FACTOR);
                canvasField.textAlign(CENTER);
                canvasField.stroke(0, 0, 0);
                canvasField.fill(64);

                canvasField.push();
                canvasField.fill(64);
                canvasField.stroke(0, 0, 0);
                canvasField.strokeWeight(2);
                canvasField.translate(x * DRAW_SCALE_FACTOR, 11.25 * DRAW_SCALE_FACTOR);
                canvasField.rotate(PI);
                canvasField.text(yardNumber * 5, 0, 0);
                canvasField.pop();

                //Towards audience
                canvasField.text(yardNumber * 5, x * DRAW_SCALE_FACTOR, (FIELD_WIDTH - 11.25) * DRAW_SCALE_FACTOR);

                canvasField.fill(255);
            }
        }
    }
}

class Dot {
    constructor(set, lr, fb, cnts, privID) {
        this.set = set;
        this.counts = cnts;
        if (lr != null) this.lefttoright = this.LeftToRightFromString(lr);
        if (fb != null) this.fronttoback = this.FrontToBackFromString(fb);

        this.privateID = privID;
    }

    LeftToRightFromString(lr) {
        var ret;
        var sideNum;
        var baseYardLine;
        var deviation;
        var lrArgs = lr.split(' ');
        lrArgs[1] = lrArgs[1].replace(':', '\0');
        sideNum = parseInt(lrArgs[1][0]);
        if (lrArgs[0] == "side") {
            if (sideNum != 1 && sideNum != 2) {
                return -1;
            }
            if (lrArgs[2] == "on") {
                baseYardLine = parseInt(lrArgs[3]);
                ret = (10 - (baseYardLine / 5)) * 8;
                if (sideNum == 1) ret = -ret;
                return ret;
            }
            else {
                deviation = parseFloat(lrArgs[2]);

                baseYardLine = parseInt(lrArgs[4]);
                ret = (10 - (baseYardLine / 5)) * 8;

                if (lrArgs[3] == "out" || lrArgs[3] == "outside") {
                    ret += deviation;
                }
                else if (lrArgs[3] == "in" || lrArgs[3] == "inside") {
                    ret -= deviation;
                }

                if (sideNum == 1) ret = -ret;
                return ret;
            }
        }
        else {
            return -1;
        }
    }

    FrontToBackFromString(fb) {
        var ret;
        var deviation;
        var fbArgs = fb.split(' ');
        if (fbArgs[0] == "on") {
            if (fbArgs[2] == "hash") {
                if (fbArgs[1] == "front") {
                    ret = -10;
                    return ret;
                }
                else if (fbArgs[1] == "back") {
                    ret = 10;
                    return ret;
                }
                else {
                    return -1;
                }
            }
            else if (fbArgs[2] == "sideline" || (fbArgs[2] == "side" && fbArgs[3] == "line")) {
                if (fbArgs[1] == "front") {
                    ret = FIELD_WIDTH / -2;
                    return ret;
                }
                else if (fbArgs[1] == "back") {
                    ret = FIELD_WIDTH / 2;
                    return ret;
                }
                else {
                    return -1;
                }
            }
            else {
                return -1;
            }
        }
        else {
            deviation = parseFloat(fbArgs[0]);
            var isInFront;
            var argBasePos;
            if (fbArgs[1] == "in" && fbArgs[2] == "front") {
                isInFront = true;
                argBasePos = 3;
            }
            else if (fbArgs[1] == "behind") {
                isInFront = false;
                argBasePos = 2;
            }
            else {
                return -1;
            }

            var baseReference = 0;
            //Get base
            if (fbArgs[argBasePos + 1] == "hash") {
                if (fbArgs[argBasePos] == "front") {
                    baseReference = -10;
                }
                else if (fbArgs[argBasePos] == "back") {
                    baseReference = 10;
                }
                else {
                    return -1;
                }
            }
            else if (fbArgs[argBasePos + 1] == "sideline" || (fbArgs[argBasePos + 1] == "side" && fbArgs[argBasePos + 2] == "line")) {
                if (fbArgs[argBasePos] == "front") {
                    baseReference = FIELD_WIDTH / -2;
                }
                else if (fbArgs[argBasePos] == "back") {
                    baseReference = FIELD_WIDTH / 2;
                }
                else {
                    return -1;
                }
            }
            else {
                return -1;
            }

            if (isInFront) {
                ret = baseReference - deviation;
                return ret;
            }
            else {
                ret = baseReference + deviation;
                return ret;
            }
        }
    }

    LeftToRightToString(lr) {
        var ret = "";
        if (lr <= 0) {
            ret += "SIDE 1: ";
            lr = -lr; //Make it positive
        }
        else {
            ret += "SIDE 2: ";
        }

        var deviation = lr % 8;
        var baseYardLineOut = 50 - ((lr - deviation) / 8) * 5;
        var baseYardLineIn = 50 - (((lr - deviation) / 8) + 1) * 5;

        if (deviation == 0) {
            ret += "On " + baseYardLineOut + " YARD LINE";
        }
        else if (deviation < 4.0) {
            ret += deviation + " OUT " + baseYardLineOut + " YARD LINE";
        }
        else {
            ret += (8.0 - deviation) + " IN " + baseYardLineIn + " YARD LINE";
        }

        return ret;
    }

    GetNearestYardLine() {
        var side1 = this.lefttoright <= 0;
        var lr = side1 ? -this.lefttoright : this.lefttoright;

        var deviation = lr % 8;
        var baseYardLineOut = 50 - ((lr - deviation) / 8) * 5;
        var baseYardLineIn = 50 - (((lr - deviation) / 8) + 1) * 5;

        if (deviation == 0) return baseYardLineOut;
        else if (deviation < 4.0) return baseYardLineOut;
        else return baseYardLineIn;
    }

    IsSide1() {
        return this.lefttoright <= 0;
    }

    FrontToBackToString(fb) {
        var ret = "";
        var baseReference = "";
        var deviationDirection = "";
        var deviation;
        var closerToAudience;

        if (fb <= 0) {
            baseReference += "FRONT ";
            fb = -fb; //Make positive
            closerToAudience = true;
        }
        else {
            baseReference += "BACK ";
            closerToAudience = false;
        }

        //Closer to hash or sideline?
        if (Math.abs(fb - (FIELD_WIDTH / 2)) < Math.abs(fb - 10)) {
            //The hash is farther away from here than the sideline is
            baseReference += "SIDELINE";
            deviation = Math.abs(fb - (FIELD_WIDTH / 2));

            if (deviation == 0) {
                ret = "On " + baseReference;
                return ret;
            }
            deviationDirection = closerToAudience ? "BEHIND " : "IN FRONT ";
        }
        else {
            //The sideline is farther away (or the same distance as) the hash
            baseReference += "HASH";
            deviation = Math.abs(fb - 10);

            if (deviation == 0) {
                ret = "On " + baseReference;
                return ret;
            }
            if (fb < 10) {
                //Within the hashes
                deviationDirection = closerToAudience ? "BEHIND " : "IN FRONT ";
            }
            else {
                //Between the hash and the sideline
                deviationDirection = closerToAudience ? "IN FRONT " : "BEHIND ";
            }
        }

        ret = deviation + " " + deviationDirection + baseReference;
        return ret;
    }

    GetNearestFrontToBackReference() {
        var closerToAudience = this.fronttoback <= 0;
        var fb = this.fronttoback <= 0 ? -this.fronttoback : this.fronttoback;

        //Closer to hash or sideline?
        if (Math.abs(fb - (FIELD_WIDTH / 2)) < Math.abs(fb - 10)) {
            //Sideline is closer
            return closerToAudience ? FRONT_SIDELINE : BACK_SIDELINE;
        }
        else {
            //Hash is closer
            return closerToAudience ? FRONT_HASH : BACK_HASH;
        }
    }

    GetDeviationFromFrontToBackReference() {
        var closerToAudience = this.fronttoback <= 0;
        var fb = this.fronttoback <= 0 ? -this.fronttoback : this.fronttoback;
        // in front = negative deviation

        //Closer to hash or sideline?
        if (Math.abs(fb - (FIELD_WIDTH / 2)) < Math.abs(fb - 10)) {
            //Sideline is closer
            var deviation = Math.abs(fb - (FIELD_WIDTH / 2));
            return closerToAudience ? deviation : -deviation;
        }
        else {
            //Hash is closer
            var deviation = Math.abs(fb - 10);
            if (fb < 10) {
                return closerToAudience ? deviation : -deviation;
            }
            else {
                return closerToAudience ? -deviation : deviation;
            }
        }
    }

    Stringify() {
        return this.set + "=" + this.LeftToRightToString(this.lefttoright) + "|" + this.FrontToBackToString(this.fronttoback);
    }

    GetDisplayX() {
        return (this.lefttoright + (FIELD_LENGTH / 2)) * DRAW_SCALE_FACTOR
    }

    GetDisplayY() {
        return (-this.fronttoback + (FIELD_WIDTH / 2)) * DRAW_SCALE_FACTOR;
    }

    show(lbl) {
        if (this.set == "-1") return;

        if (stepMode && !showMode) {
            if (this.privateID != stepCurrent && this.privateID != stepCurrent + 1) return;
        }

        stroke(showMode ? 255 : 0, showMode ? 0 : 255, 0);
        strokeWeight(DRAW_SCALE_FACTOR * 0.75);

        point(this.GetDisplayX(), this.GetDisplayY());

        if (showMode && document.getElementById("nShowLabels").checked) {
            textSize(DRAW_SCALE_FACTOR);
            strokeWeight(1);
            textAlign(CENTER, CENTER)
            fill(0, 0, 0);
            text(lbl, this.GetDisplayX(), this.GetDisplayY());
        }

        if (showMode) return;
        if (stepMode && this.privateID != stepCurrent) return;

        var nDot = drill.NextDot(this);
        if (nDot != null) {
            //Draw arrow
            //if ((this.lefttoright != nDot.lefttoright) && (this.fronttoback != nDot.fronttoback)) {
            stroke(255, 0, 0);
            strokeWeight(1);

            line(this.GetDisplayX(), this.GetDisplayY(), nDot.GetDisplayX(), nDot.GetDisplayY());

            push();
            var angle = Math.atan2(this.GetDisplayY() - nDot.GetDisplayY(), this.GetDisplayX() - nDot.GetDisplayX());
            var offset = DRAW_SCALE_FACTOR;
            translate(nDot.GetDisplayX(), nDot.GetDisplayY());
            rotate(angle - HALF_PI);
            noFill();
            triangle(-offset * 0.5, offset, offset * 0.5, offset, 0, -offset / 2)
            pop();
            //}

            //Draw midset dot
            var midDot = drill.GetMidpointToNextDot(this);
            noFill();
            circle(midDot.GetDisplayX(), midDot.GetDisplayY(), DRAW_SCALE_FACTOR * 0.75);
        }
    }
}

class Drill {
    constructor() {
        this.dots = [];
    }

    AddDot(_inp, cnts) {
        var inp = _inp.toLowerCase();
        var p1 = inp.split('=');
        var p2 = p1[1].split('|');

        var privId = this.dots.length;
        this.dots.push(new Dot(p1[0], p2[0], p2[1], cnts, privId));
    }

    NextDot(currDot) {
        return this.dots[currDot.privateID + 1];
    }

    PreviousDot(currDot) {
        return this.dots[currDot.privateID - 1];
    }

    GetDot(set) {
        for (var i = 0; i < this.dots.length; i++) {
            if (this.dots[i].set == set) {
                return this.dots[i];
            }
        }
        return null;
    }

    GetSetName(dNum) {
        if (dNum >= this.dots.length) return null;
        return this.dots[dNum].set;
    }

    GetMidpointToNextDot(currDot) {
        var ret = new Dot();
        var next = this.NextDot(currDot);

        ret.set = "midpoint from " + currDot.set + " to " + next.set;
        ret.lefttoright = (currDot.lefttoright + next.lefttoright) / 2;
        ret.fronttoback = (currDot.fronttoback + next.fronttoback) / 2;

        return ret;
    }

    show() {
        for (var i = 0; i < this.dots.length; i++) {
            this.dots[i].show();
        }
    }
}

class Program {
    constructor() {
        this.absoluteStartCount = null;
        this.tempo = null;
        this.tempoMode = null;
    }
}

class Performer {
    constructor() {
        this.label = null;
        this.dots = [];
    }

    show() {

        if (!playMode) {
            if (this.dots[stepCurrent].set == "-1") return;
            this.SlideModeDot().show(this.label);
        }
        else {
            if (this.dots[playManager.currDot].set == "-1") return;
            this.DrawModeDot(playManager.delta / playManager.timeDuration).show(this.label);
        }
    }

    SlideModeDot() {
        var ret = new Dot();

        var currLR = this.dots[stepCurrent].lefttoright;
        var currFB = this.dots[stepCurrent].fronttoback;
        var nextLR = this.dots[stepCurrent + 1].lefttoright;
        var nextFB = this.dots[stepCurrent + 1].fronttoback;

        var prg = (sliderCount - 1) / (document.getElementById("countSlider").max - 1);

        ret.lefttoright = currLR + (nextLR - currLR) * prg;
        ret.fronttoback = currFB + (nextFB - currFB) * prg;
        return ret;
    }

    DrawModeDot(prg) {
        var ret = new Dot();

        var currLR = this.dots[playManager.currDot].lefttoright;
        var currFB = this.dots[playManager.currDot].fronttoback;
        var nextLR = this.dots[playManager.nextDot].lefttoright;
        var nextFB = this.dots[playManager.nextDot].fronttoback;

        var startLR = currLR + ((nextLR - currLR) * ((playManager.count - 1) / playManager.GetNextDot().counts));
        var startFB = currFB + ((nextFB - currFB) * ((playManager.count - 1) / playManager.GetNextDot().counts));
        var endLR = currLR + ((nextLR - currLR) * (playManager.count / playManager.GetNextDot().counts));
        var endFB = currFB + ((nextFB - currFB) * (playManager.count / playManager.GetNextDot().counts));

        ret.lefttoright = startLR + (endLR - startLR) * prg;
        ret.fronttoback = startFB + (endFB - startFB) * prg;
        return ret;
    }
}

class PlayManager {
    constructor() {
        this.performers = [];
        this.program = [];

        this.tempo = 0;
        this.currDot = null;
        this.nextDot = null;
        this.timeStart = 0;
        this.timeDuration = 0;
        this.delta = 0;
        this.playProgramStep = 0;
        this.absoluteCount = 0;
        this.count = 0
    }

    Setup() {
        this.currDot = stepMode ? stepCurrent : 0;
        this.nextDot = this.currDot + 1;
        this.absoluteCount = this.CalculateAbsoluteCount(this.GetCurrentDot().set);

        this.playProgramStep = 0;
        while (true) {
            if (this.program[this.playProgramStep] != null) {
                if (this.program[this.playProgramStep + 1] != null) {
                    if (this.program[this.playProgramStep + 1].absoluteStartCount < this.absoluteCount) {
                        this.playProgramStep++;
                    }
                    else {
                        break;
                    }
                }
                else {
                    break;
                }
            }
        }

        this.delta = 0;
        this.count = 1;
        this.HandleProgram();

        this.timeStart = Date.now();
        this.timeDuration = 60000 / this.tempo;
    }

    HandleProgram() {
        this.tempo = this.program[this.playProgramStep].tempo;

        //How to cheat dynamic tempo changes
        if (this.program[this.playProgramStep].tempoMode == "dynamicStart") {
            var tempoStart = this.tempo;

            var i = this.playProgramStep + 1;
            while (this.program[i].tempoMode != "dynamicEnd") {
                i++;
            }

            var tempoEnd = this.program[i].tempo;

            this.tempo = (tempoStart + tempoEnd) / 2;
        }

        this.playProgramStep++;
    }

    GetCurrentDot() {
        return this.performers[0].dots[this.currDot];
    }

    GetNextDot() {
        return this.performers[0].dots[this.nextDot];
    }

    GetCurrentProgram() {
        return this.program[this.playProgramStep];
    }

    GetCounts(dNum) {
        if (dNum >= this.performers[0].dots.length) return null;
        return this.performers[0].dots[dNum].counts;
    }

    OnTick() {
        //When the "counts" value updates
        if (this.count > this.GetNextDot().counts) {
            //New set!
            this.currDot++;
            if (this.currDot + 1 < this.performers[0].dots.length) this.nextDot++;
            if (this.currDot >= this.nextDot) playMode = false;
            this.count = 1;
        }

        if (this.GetCurrentProgram() != null) {
            if (this.GetCurrentProgram().absoluteStartCount == this.absoluteCount) {
                this.HandleProgram();
            }
        }

        this.timeStart = Date.now();
        this.timeDuration = 60000 / this.tempo;
    }

    CalculateAbsoluteCount(setName) {
        var i = 0;
        var ret = 0;
        while (this.GetSetName(i) != setName) {
            i++;
            ret += this.performers[0].dots[i].counts;
        }
        return ret + 1;
    }

    /*NewSet() {
        this.currDot++;
        if (this.currDot + 1 < this.performers[0].dots.length) this.nextDot++;
        if (this.currDot >= this.nextDot) playMode = false;
        this.timeStart = Date.now();
        this.timeDuration = ((this.performers[0].dots[this.nextDot].counts) / this.tempo) * 60000;
    }*/

    Update() {
        this.delta = Date.now() - this.timeStart;

        if (this.delta >= this.timeDuration) {
            this.count++;
            this.absoluteCount++;

            this.OnTick();
            this.delta = Date.now() - this.timeStart;
        }

        document.getElementById("nPlaySet").innerHTML = "FROM SET " + this.GetSetName(this.currDot) + " TO SET " + this.GetSetName(this.nextDot);
        document.getElementById("nPlayCount").innerHTML = "COUNT: " + this.count;
        document.getElementById("nPlayTempo").innerHTML = "TEMPO: " + this.tempo;

        drawing = true;
    }

    GetSetName(dNum) {
        if (dNum >= this.performers[0].dots.length) return null;
        return this.performers[0].dots[dNum].set;
    }

    GetPerformerByLabel(lbl) {
        for (var i = 0; i < this.performers.length; i++) {
            if (this.performers[i].label == lbl) {
                return this.performers[i];
            }
        }
        return null;
    }

    show() {
        for (var i = 0; i < this.performers.length; i++) {
            this.performers[i].show();
        }
    }
}

function AddDotButton() {
    var arg = document.getElementById("setMsg").value + "=" + document.getElementById("lrMsg").value + "|" + document.getElementById("fbMsg").value;
    drill.AddDot(arg, document.getElementById("countsMsg").value);
    drawing = true;
}

function CalcMidsetButton() {
    var mid = drill.GetMidpointToNextDot(drill.GetDot(document.getElementById("midMsg").value));
    document.getElementById("midMsgOutput").innerHTML = mid.Stringify();
}

function ExportDrill() {
    var downloadStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(showMode ? playManager : drill, null, "\t"));
    var htmlElement = document.getElementById('exportdrill');
    htmlElement.setAttribute("href", downloadStr);
    htmlElement.setAttribute("download", "drill.json");
    htmlElement.click();
}

document.querySelector('#importdrill').addEventListener("change", function () {
    var inputFile = document.getElementById('importdrill').files[0];
    var reader = new FileReader();
    reader.addEventListener('load', function (e) {
        var funny = JSON.parse(e.target.result);

        if (!showMode) {
            drill = new Drill();
            for (var i = 0; i < funny.dots.length; i++) {
                var mDot = new Dot();
                mDot.set = funny.dots[i].set;
                mDot.counts = funny.dots[i].counts;
                mDot.lefttoright = funny.dots[i].lefttoright;
                mDot.fronttoback = funny.dots[i].fronttoback;
                mDot.privateID = funny.dots[i].privateID;
                drill.dots.push(mDot);
            }
        }
        else {
            playManager = new PlayManager();
            for (var i = 0; i < funny.performers.length; i++) {
                var mPerformer = new Performer();
                mPerformer.label = funny.performers[i].label;

                for (var j = 0; j < funny.performers[i].dots.length; j++) {
                    var mDot = new Dot();
                    mDot.set = funny.performers[i].dots[j].set;
                    mDot.counts = funny.performers[i].dots[j].counts;
                    mDot.lefttoright = funny.performers[i].dots[j].lefttoright;
                    mDot.fronttoback = funny.performers[i].dots[j].fronttoback;
                    mPerformer.dots.push(mDot);
                }
                playManager.performers.push(mPerformer);
            }
            for (var i = 0; i < funny.program.length; i++) {
                var prg = new Program();
                prg.absoluteStartCount = funny.program[i].absoluteStartCount;
                prg.tempo = funny.program[i].tempo;
                prg.tempoMode = funny.program[i].tempoMode;
                playManager.program.push(prg);
            }
        }

        drawing = true;
    });
    reader.readAsText(inputFile);
});

function StepByStep() {
    stepMode = !stepMode;
    document.getElementById('nStep').innerHTML = stepMode ? "Show Default View" : "Show Set By Set";
    //document.getElementById('nPrevSet').disabled = !stepMode;
    document.getElementById('nNextSet').disabled = !stepMode;

    stepCurrent = 0;
    if (!showMode) document.getElementById('nStepStatus').innerHTML = stepMode ? ("From " + drill.GetSetName(stepCurrent) + " to " + drill.GetSetName(stepCurrent + 1)) : "Default View";
    else {
        document.getElementById('nStepStatus').innerHTML = stepMode ? ("From " + playManager.GetSetName(stepCurrent) + " to " + playManager.GetSetName(stepCurrent + 1)) : "Default View";
        sliderCount = 1;
        document.getElementById("countSlider").max = playManager.GetCounts(stepCurrent + 1) + 1;
        document.getElementById("countSliderText").value = 1;
        document.getElementById("countSlider").value = 1;
    }

    if (stepMode) {
        if (!showMode && stepCurrent + 2 >= drill.dots.length) document.getElementById('nNextSet').disabled = true;
        if (showMode && stepCurrent + 2 >= playManager.performers[0].dots.length) document.getElementById('nNextSet').disabled = true;
    }

    if (!showMode) {
        document.getElementById("midMsg").value = drill.GetSetName(stepCurrent);
        CalcMidsetButton();
    }

    drawing = true;
}

function StepNextSet() {
    stepCurrent++;
    document.getElementById('nPrevSet').disabled = false;
    if (showMode) document.getElementById('nStepStatus').innerHTML = "From " + playManager.GetSetName(stepCurrent) + " to " + playManager.GetSetName(stepCurrent + 1);
    else document.getElementById('nStepStatus').innerHTML = "From " + drill.GetSetName(stepCurrent) + " to " + drill.GetSetName(stepCurrent + 1);
    //if ((stepCurrent + 2 >= drill.dots.length) || (stepCurrent + 2 >= playManager.performers[0].dots.length)) document.getElementById('nNextSet').disabled = true;
    if (!showMode) {
        if (stepCurrent + 2 >= drill.dots.length) document.getElementById('nNextSet').disabled = true;
    }
    else {
        if (stepCurrent + 2 >= playManager.performers[0].dots.length) document.getElementById('nNextSet').disabled = true;
        sliderCount = 1;
        document.getElementById("countSlider").max = playManager.GetCounts(stepCurrent + 1) + 1;
        document.getElementById("countSliderText").value = 1;
        document.getElementById("countSlider").value = 1;
    }

    if (!showMode) {
        document.getElementById("midMsg").value = drill.GetSetName(stepCurrent);
        CalcMidsetButton();
    }

    drawing = true;
}

function StepPrevSet() {
    stepCurrent--;
    document.getElementById('nNextSet').disabled = false;
    if (showMode) {
        document.getElementById('nStepStatus').innerHTML = "From " + playManager.GetSetName(stepCurrent) + " to " + playManager.GetSetName(stepCurrent + 1);
        sliderCount = 1;
        document.getElementById("countSlider").max = playManager.GetCounts(stepCurrent + 1) + 1;
        document.getElementById("countSliderText").value = 1;
        document.getElementById("countSlider").value = 1;
    }
    else {
        document.getElementById('nStepStatus').innerHTML = "From " + drill.GetSetName(stepCurrent) + " to " + drill.GetSetName(stepCurrent + 1);
    }
    if (stepCurrent == 0) document.getElementById('nPrevSet').disabled = true;

    if (!showMode) {
        document.getElementById("midMsg").value = drill.GetSetName(stepCurrent);
        CalcMidsetButton();
    }

    sliderCount = 1;

    drawing = true;
}

function SwitchMode() {
    showMode = !showMode;
    playMode = false;
    stepMode = false;

    document.getElementById("nSwitchMode").innerHTML = showMode ? "Individual Mode" : "Full Production Mode";

    document.getElementById("nPlay").hidden = !showMode;
    document.getElementById("nPlaySet").hidden = !showMode;
    document.getElementById("nPlayCount").hidden = !showMode;
    //document.getElementById("nPlayTempo").hidden = !showMode;
    document.getElementById("nShowLabels").hidden = !showMode;
    document.getElementById("nLabelLabel").hidden = !showMode;

    document.getElementById("individual-stuff").hidden = showMode;

    drill = new Drill();
    playManager = new PlayManager();

    drawing = true;
}

function PlayButton() {
    playManager.Setup();
    playMode = !playMode;
    drawing = true;
}

function DotBookPage(dot, previousDot, performerLabel) {
    var pg = createGraphics(600, 500);

    pg.background(100)

    //Make chart # layout
    pg.rect(20, 20, 150, 50);
    pg.textAlign(CENTER, CENTER);
    pg.textSize(48);
    pg.text(dot.set, 95, 45);

    //Make counts layout
    pg.rect(20, 80, 150, 50);
    pg.text(dot.counts, 95, 105);

    //Make coordinate layout
    pg.rect(180, 20, 400, 110);
    pg.textSize(16);
    pg.textAlign(LEFT, CENTER);
    var sameFlag = false;
    if (previousDot != null) {
        if (previousDot.lefttoright == dot.lefttoright && previousDot.fronttoback == dot.fronttoback) {
            sameFlag = true;
            pg.text("<SAME>", 200, 45);
            pg.text("<SAME>", 200, 105);
        }
        else {
            pg.text(dot.LeftToRightToString(dot.lefttoright), 200, 45);
            pg.text(dot.FrontToBackToString(dot.fronttoback), 200, 105);
        }
    }
    else {
        pg.text(dot.LeftToRightToString(dot.lefttoright), 200, 45);
        pg.text(dot.FrontToBackToString(dot.fronttoback), 200, 105);
    }

    //Make midset layout
    pg.rect(310, 140, 270, 150);
    var midpoint = null;
    if (sameFlag || previousDot == null) {
        pg.text("----", 330, 155);
        pg.text("----", 330, 265);
    }
    else {
        midpoint = new Dot();
        midpoint.lefttoright = (previousDot.lefttoright + dot.lefttoright) / 2;
        midpoint.fronttoback = (previousDot.fronttoback + dot.fronttoback) / 2;
        pg.text(midpoint.LeftToRightToString(midpoint.lefttoright), 330, 155);
        pg.text(midpoint.FrontToBackToString(midpoint.fronttoback), 330, 265);
    }

    //Make graph layout
    const GRAPH_SCALE_FACTOR = 7;
    const GRAPH_FIELD_LENGTH = 40;
    const GRAPH_FIELD_WIDTH = 32;
    pg.rect(20, 140, GRAPH_FIELD_LENGTH * GRAPH_SCALE_FACTOR, GRAPH_FIELD_WIDTH * GRAPH_SCALE_FACTOR);
    var dotField = createGraphics(GRAPH_FIELD_LENGTH * GRAPH_SCALE_FACTOR, GRAPH_FIELD_WIDTH * GRAPH_SCALE_FACTOR);
    for (var x = 0; x < GRAPH_FIELD_LENGTH + 1; x++) {
        for (var y = 0; y < GRAPH_FIELD_WIDTH + 1; y++) {
            dotField.stroke(192, 192, 192);
            dotField.strokeWeight(1);

            if (y % 4 == 0) {
                dotField.stroke(127, 127, 255);
            }
            dotField.line(0, y * GRAPH_SCALE_FACTOR, GRAPH_FIELD_LENGTH * GRAPH_SCALE_FACTOR, y * GRAPH_SCALE_FACTOR);

            dotField.stroke(192, 192, 192);

            if (x % 4 == 0) {
                dotField.stroke(127, 127, 255);
            }
            if ((x + 4) % 8 == 0) {
                dotField.stroke(0, 0, 0);
            }
            dotField.line(x * GRAPH_SCALE_FACTOR, 0, x * GRAPH_SCALE_FACTOR, GRAPH_FIELD_WIDTH * GRAPH_SCALE_FACTOR);
        }
    }
    //-Get dot to be somewhere in the middle of the graph
    var fieldX = (dot.lefttoright + 4 + (FIELD_LENGTH / 2)) % GRAPH_FIELD_LENGTH;
    var fieldY = (dot.fronttoback + (FIELD_WIDTH / 2)) % GRAPH_FIELD_WIDTH;
    var translationX = 0;
    var translationY = 0;

    while (fieldX - 20 > 4) {
        fieldX -= 8;
        translationX -= 8;
    }
    while (fieldX - 20 < -4) {
        fieldX += 8;
        translationX += 8;
    }
    while (fieldY - 16 > 2) {
        fieldY -= 4;
        translationY -= 4;
    }
    while (fieldY - 16 < -2) {
        fieldY += 4;
        translationY += 4;
    }

    fieldY = GRAPH_FIELD_WIDTH - fieldY;

    //-If there's (what counts as) a previous dot, then figure out where to put it
    var previousFieldX = 0;
    var previousFieldY = 0;
    var drawPreviousDot = false;

    if (previousDot != null && !sameFlag) {
        var deltaX = dot.lefttoright - previousDot.lefttoright;
        var deltaY = dot.fronttoback - previousDot.fronttoback;

        if (deltaX <= GRAPH_FIELD_LENGTH && deltaY <= GRAPH_FIELD_WIDTH) {
            drawPreviousDot = true;
            previousFieldX = fieldX - deltaX;
            previousFieldY = fieldY + deltaY;

            while (previousFieldX > GRAPH_FIELD_LENGTH) {
                fieldX -= 8;
                previousFieldX -= 8;
            }
            while (previousFieldX < 0) {
                fieldX += 8;
                previousFieldX += 8;
            }
            while (previousFieldY > GRAPH_FIELD_WIDTH) {
                fieldY -= 4;
                previousFieldY -= 4;
            }
            while (previousFieldY < 0) {
                fieldY += 4;
                previousFieldY += 4;
            }
        }
    }
    //-Bound by field comes last
    var distanceFromSide1Endzone = dot.lefttoright + (FIELD_LENGTH / 2);
    var distanceFromSide2Endzone = FIELD_LENGTH - (dot.lefttoright + (FIELD_LENGTH / 2));
    var distanceFromFrontSideline = dot.fronttoback + (FIELD_WIDTH / 2);
    var distanceFromBackSideline = FIELD_WIDTH - (dot.fronttoback + (FIELD_WIDTH / 2));

    var distanceFromLeftBound = fieldX;
    var distanceFromRightBound = GRAPH_FIELD_LENGTH - fieldX;
    var distanceFromTopBound = fieldY;
    var distanceFromBottomBound = GRAPH_FIELD_WIDTH - fieldY;

    while (distanceFromSide1Endzone < distanceFromLeftBound) {
        fieldX -= 8;
        previousFieldX -= 8;
        distanceFromLeftBound -= 8;
    }
    while (distanceFromSide2Endzone < distanceFromRightBound) {
        fieldX += 8;
        previousFieldX += 8;
        distanceFromRightBound -= 8;
    }
    while (distanceFromFrontSideline < distanceFromBottomBound) {
        fieldY += 4;
        previousFieldY += 4;
        distanceFromBottomBound -= 4;
    }
    while (distanceFromBackSideline < distanceFromTopBound) {
        fieldY -= 4;
        previousFieldY -= 4;
        distanceFromTopBound -= 4;
    }

    if (distanceFromSide1Endzone < 4) {
        fieldX += 8;
        previousFieldX += 8;
    }
    if (distanceFromSide2Endzone < 4) {
        fieldX -= 8;
        previousFieldX -= 8;
    }

    //-Draw hashes and sidelines
    var nearestRef = dot.GetNearestFrontToBackReference();
    var deviation = dot.GetDeviationFromFrontToBackReference();

    var backSidelineY;
    var backHashY;
    var frontHashY;
    var frontSidelineY;

    switch (nearestRef) {
        case BACK_SIDELINE:
            backSidelineY = fieldY + deviation;
            backHashY = backSidelineY + 32;
            frontHashY = backHashY + 20;
            frontSidelineY = frontHashY + 32;
            break;
        case BACK_HASH:
            backHashY = fieldY + deviation;
            backSidelineY = backHashY - 32;
            frontHashY = backHashY + 20;
            frontSidelineY = frontHashY + 32;
            break;
        case FRONT_HASH:
            frontHashY = fieldY + deviation;
            backHashY = frontHashY - 20;
            backSidelineY = backHashY - 32;
            frontSidelineY = frontHashY + 32;
            break;
        case FRONT_SIDELINE:
            frontSidelineY = fieldY + deviation;
            frontHashY = frontSidelineY - 32;
            backHashY = frontHashY - 20;
            backSidelineY = backHashY - 32;
            break;
    }

    for (var x = 0; x < GRAPH_FIELD_LENGTH + 1; x++) {
        for (var y = 0; y < GRAPH_FIELD_WIDTH + 1; y++) {
            dotField.stroke(0, 0, 0);
            dotField.strokeWeight(4);

            if ((x + 4) % 8 == 0 && (y == frontHashY || y == backHashY)) {
                dotField.line((x - 1) * GRAPH_SCALE_FACTOR, y * GRAPH_SCALE_FACTOR, (x + 1) * GRAPH_SCALE_FACTOR, y * GRAPH_SCALE_FACTOR);
            }
            if (y == frontSidelineY || y == backSidelineY) {
                dotField.line(0, y * GRAPH_SCALE_FACTOR, GRAPH_FIELD_LENGTH * GRAPH_SCALE_FACTOR, y * GRAPH_SCALE_FACTOR);
            }

            //-TODO: Draw endzones
        }
    }

    //-Draw dot(s)
    dotField.strokeWeight(GRAPH_SCALE_FACTOR);

    if (drawPreviousDot) {
        dotField.stroke(0, 0, 0);
        dotField.point(previousFieldX * GRAPH_SCALE_FACTOR, previousFieldY * GRAPH_SCALE_FACTOR);

        dotField.strokeWeight(1);
        dotField.line(previousFieldX * GRAPH_SCALE_FACTOR, previousFieldY * GRAPH_SCALE_FACTOR, fieldX * GRAPH_SCALE_FACTOR, fieldY * GRAPH_SCALE_FACTOR);

        dotField.push();
        var angle = Math.atan2(previousFieldY * GRAPH_SCALE_FACTOR - fieldY * GRAPH_SCALE_FACTOR, previousFieldX * GRAPH_SCALE_FACTOR - fieldX * GRAPH_SCALE_FACTOR);
        var offset = GRAPH_SCALE_FACTOR;
        dotField.translate(fieldX * GRAPH_SCALE_FACTOR, fieldY * GRAPH_SCALE_FACTOR);
        dotField.rotate(angle - HALF_PI);
        dotField.noFill();
        dotField.triangle(-offset * 0.5, offset, offset * 0.5, offset, 0, -offset / 2);
        dotField.pop();
    }

    dotField.stroke(255, 0, 0);
    dotField.strokeWeight(GRAPH_SCALE_FACTOR);
    dotField.point(fieldX * GRAPH_SCALE_FACTOR, fieldY * GRAPH_SCALE_FACTOR);

    var yds = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5, 0];
    var ydLabels = [-1, -1, -1, -1, -1];
    var occr = 0;
    var ydIdx = 0;

    for (var i = 0; i < yds.length; i++) {
        if (yds[i] == dot.GetNearestYardLine()) {
            occr++;
            if (yds[i] == 50) {
                ydIdx = i;
                break;
            }
            if (dot.IsSide1()) {
                ydIdx = i;
                break;
            }
            else if (occr == 2) {
                ydIdx = i;
                break;
            }
        }
    }

    ydLabels[0] = yds[i - 2];
    ydLabels[1] = yds[i - 1];
    ydLabels[2] = yds[i - 0];
    ydLabels[3] = yds[i + 1];
    ydLabels[4] = yds[i + 2];

    //-Make yard line number layouts
    for (var i = 0; i < 5; i++) {
        pg.rect((4 * GRAPH_SCALE_FACTOR) + (i * 8) * GRAPH_SCALE_FACTOR, (150 + GRAPH_FIELD_WIDTH * GRAPH_SCALE_FACTOR), 40, 40);

        pg.textAlign(LEFT, TOP);
        pg.textSize(30);
        pg.text(ydLabels[i], (4 * GRAPH_SCALE_FACTOR) + (i * 8) * GRAPH_SCALE_FACTOR, (150 + GRAPH_FIELD_WIDTH * GRAPH_SCALE_FACTOR))
    }

    pg.image(dotField, 20, 140);

    pg.save(performerLabel.label + " set " + dot.set + ".png");
    image(pg, 0, 0);
}

function MakeDotBook() {
    if (showMode) {
        dotBookMode = !dotBookMode;
        var bookPerformer = playManager.GetPerformerByLabel(document.getElementById("nMakeDotBook").value);
        //for (var i = 0; i < bookPerformer.dots.length; i++) {
        var i = stepCurrent;
        var pDot = i > 0 ? bookPerformer.dots[i - 1] : null;
        DotBookPage(bookPerformer.dots[i], pDot, bookPerformer);
        //}
    }
}

function HandleSlider(sliderVal) {
    sliderCount = sliderVal;
    document.getElementById("countSliderText").value = sliderCount;
    drawing = true;
}

function HandleTextSlider(_textSliderVal) {
    var textSliderVal = parseFloat(_textSliderVal);
    if (textSliderVal == NaN) {
        return;
    }

    if (textSliderVal < 1) {
        sliderCount = 1;
        document.getElementById("countSlider").value = sliderCount;
    }
    else if (textSliderVal > document.getElementById("countSlider").max) {
        sliderCount = document.getElementById("countSlider").max;
        document.getElementById("countSlider").value = sliderCount;
    }
    else {
        sliderCount = textSliderVal;
        document.getElementById("countSlider").value = sliderCount;
    }
    drawing = true;
}