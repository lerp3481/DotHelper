const FIELD_LENGTH = 160;
const FIELD_WIDTH = 84;
const DRAW_SCALE_FACTOR = 10;

var drill;
var drawing = true;

var stepMode = false;
var stepCurrent = 0;

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
        this.startSet = null;
        this.startCount = null;
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
            this.dots[stepCurrent].show(this.label);
        }
        else {
            if (this.dots[playManager.currDot].set == "-1") return;
            this.DrawModeDot(playManager.delta / playManager.timeDuration).show(this.label);
        }
    }

    DrawModeDot(prg) {
        var ret = new Dot();
        ret.lefttoright = this.dots[playManager.currDot].lefttoright + ((this.dots[playManager.nextDot].lefttoright - this.dots[playManager.currDot].lefttoright) * prg);
        ret.fronttoback = this.dots[playManager.currDot].fronttoback + ((this.dots[playManager.nextDot].fronttoback - this.dots[playManager.currDot].fronttoback) * prg);
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
        this.count = 0;
        this.oldCount = 0;
    }

    Setup() {
        this.currDot = stepMode ? stepCurrent : 0;
        this.nextDot = this.currDot + 1;

        this.count = 1;

        var i = this.currDot;
        while (true) {
            this.playProgramStep = 0;
            while (this.program[this.playProgramStep].startSet != this.GetSetName(i)) {
                this.playProgramStep++;
                if (this.playProgramStep >= this.program.length) {
                    break;
                }
            }
            if (this.playProgramStep >= this.program.length) {
                i--;
                continue;
            }
            while (this.program[this.playProgramStep + 1].startSet == this.GetSetName(i)) {
                this.playProgramStep++;
            }
            break;
        }
        this.tempo = this.program[this.playProgramStep].tempo;
        if (this.program[this.playProgramStep].tempoMode == "dynamicStart") {
            var tempoStart = this.tempo;

            i = this.playProgramStep + 1;
            while (this.program[i].tempoMode != "dynamicEnd") {
                i++;
            }

            var tempoEnd = this.program[i].tempo;

            this.tempo = (tempoStart + tempoEnd) / 2;
        }
        this.playProgramStep++;

        this.CalculateTimeDuration();
        this.timeStart = Date.now();
    }

    CalculateTimeDuration() {
        /*
        //this.timeDuration = ((this.performers[0].dots[this.nextDot].counts) / this.tempo) * 60000;
        var i = this.playProgramStep;
        var j = this.tempo;
        var k = -1;
        while (this.program[i].startSet == this.GetSetName(this.currDot)) {
            this.timeDuration += ((this.program[i].startCount - k) / j) * 60000;

            k = this.program[i].startCount;
            i++;
            if (i >= this.program.length) break;
            j = this.program[i].tempo;
        }
        if (this.timeDuration == 0) {
            this.timeDuration = ((this.performers[0].dots[this.nextDot].counts) / this.tempo) * 60000;
        }
        else {/*
            if (i < this.program.length) {
                this.timeDuration += ((this.performers[0].dots[this.currDot].counts + 1 - this.program[i].startCount) / j) + 60000;
            }*/
        /* //bc vscode is funny
        console.log("TEST: " + this.timeDuration);
    }*/
        this.timeDuration = -1;

        var currentStep = this.playProgramStep;
        var currentTempo = this.tempo;
        var countSubtractor = 1;

        if (currentStep >= this.program.length) {
            this.timeDuration = ((this.performers[0].dots[this.nextDot].counts) / this.tempo) * 60000;
            return;
        }
        while (this.program[currentStep].startSet == this.GetSetName(this.currDot)) {
            //Okay, this program will take effect during this set.
            this.timeDuration += ((this.program[currentStep].startCount - countSubtractor) / currentTempo) * 60000;

            countSubtractor = this.program[currentStep].startCount;
            if (this.program[currentStep].tempoMode == "dynamicStart") {
                var tempoStart = this.program[currentStep].tempo;

                var i = currentStep + 1;
                while (this.program[i].tempoMode != "dynamicEnd") {
                    i++;
                }

                var tempoEnd = this.program[i].tempo;

                currentTempo = (tempoStart + tempoEnd) / 2;
            }
            else {
                currentTempo = this.program[currentStep].tempo;
            }

            currentStep++;
            if (currentStep >= this.program.length) break;
        }
        if (this.timeDuration == -1) {
            this.timeDuration = ((this.performers[0].dots[this.nextDot].counts) / this.tempo) * 60000;
            return;
        }
        else {
            if (currentStep < this.program.length) {
                this.timeDuration += ((this.performers[0].dots[this.nextDot].counts + 1 - countSubtractor) / currentTempo) * 60000;
            }
        }
    }

    NewSet() {
        this.currDot++;
        if (this.currDot + 1 < this.performers[0].dots.length) this.nextDot++;
        if (this.currDot >= this.nextDot) playMode = false;
        this.count = 1;

        this.CalculateTimeDuration();
        this.timeStart = Date.now();
    }

    Update() {
        this.delta = Date.now() - this.timeStart;
        if (this.delta >= this.timeDuration) {
            this.NewSet();
            this.delta = Date.now() - this.timeStart;
        }

        this.oldCount = Math.floor((this.delta * this.tempo) / 60000) + 1;
        //this.oldCount = Math.floor((this.delta / this.timeDuration) * this.performers[0].dots[this.nextDot].counts) + 1;

        if (this.count != this.oldCount) {
            if (this.program[this.playProgramStep] != null) {
                if (this.program[this.playProgramStep].startSet == this.GetSetName(this.currDot)) {
                    if (this.program[this.playProgramStep].startCount == this.count) {
                        this.tempo = this.program[this.playProgramStep].tempo;

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
                }
            }
        }

        this.count = Math.floor((this.delta * this.tempo) / 60000) + 1;

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
                prg.startSet = funny.program[i].startSet;
                prg.startCount = funny.program[i].startCount;
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
    if (showMode) document.getElementById('nStepStatus').innerHTML = "From " + playManager.GetSetName(stepCurrent) + " to " + playManager.GetSetName(stepCurrent + 1);
    else document.getElementById('nStepStatus').innerHTML = "From " + drill.GetSetName(stepCurrent) + " to " + drill.GetSetName(stepCurrent + 1);
    if (stepCurrent == 0) document.getElementById('nPrevSet').disabled = true;

    if (!showMode) {
        document.getElementById("midMsg").value = drill.GetSetName(stepCurrent);
        CalcMidsetButton();
    }

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
    document.getElementById("nPlayTempo").hidden = !showMode;
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