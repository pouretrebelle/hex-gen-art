"use strict";
var hexRadius = 18;
var hexLineWeight = 1;
var hexDoubleLineOffset = 6;
var hexMargin = 2;
var drawLines = true;
var drawPoints = false;
var zenoSway = 0.2;
var drawHex = true;
var drawGrid = true;
var creatorCount = 1;
var destroyerCount = 3;
var drawAgents = true;
var agentsMoving = true;
var drawMouse = true;
var mouseTargetHex;
var mouseLastHex;
var hexHeight, hexWidth, columns, rows, mousePos;
var hexagons = [];
var agents = [];
function drawHexagon(pixelPos) {
    push();
    translate(pixelPos.x, pixelPos.y);
    beginShape();
    for (var i = 0; i < 6; i++) {
        vertex((hexRadius - hexMargin / 2) * cos(i * Math.PI / 3), (hexRadius - hexMargin / 2) * sin(i * Math.PI / 3));
    }
    endShape(CLOSE);
    pop();
}
function getEdgePos(i, offset) {
    var pos = createVector(offset * hexDoubleLineOffset * 0.5, -hexHeight / 2);
    pos.rotate(i * Math.PI / 3);
    return pos;
}
function wrap6(num) {
    return (num + 6) % 6;
}
function mouseOnScreen() {
    if (mouseX < 0 || mouseX >= width || mouseX === undefined)
        return false;
    if (mouseY < 0 || mouseY >= height || mouseY === undefined)
        return false;
    return true;
}
function setup() {
    hexWidth = hexRadius * 2;
    hexHeight = Math.sqrt(3) * hexRadius;
    columns = Math.ceil(window.innerWidth / (hexRadius * 3));
    rows = Math.ceil(window.innerHeight / (hexHeight / 2)) + 1;
    mousePos = createVector(0, 0);
    createCanvas((columns + 1 / 4) * (hexRadius * 3), (rows + 1) * (hexHeight / 2));
    frameRate(60);
    for (var x = 0; x < columns; x++) {
        hexagons.push([]);
        for (var y = 0; y < rows; y++) {
            hexagons[x].push(new Hex(x, y));
        }
    }
    for (var x = 0; x < columns; x++) {
        for (var y = 0; y < rows; y++) {
            hexagons[x][y].initialiseNeighbours(x, y);
        }
    }
    for (var i = 0; i < creatorCount + destroyerCount; i++) {
        var creator = (i < creatorCount) ? true : false;
        agents.push(new Agent(creator));
    }
}
function draw() {
    if (drawGrid) {
        background(25);
    }
    else {
        background(9);
    }
    if (drawHex || drawGrid) {
        for (var y = 0; y < rows; y++) {
            for (var x = 0; x < columns; x++) {
                hexagons[x][y].drawHex();
            }
        }
    }
    if (drawAgents) {
        for (var i = 0; i < creatorCount + destroyerCount; i++) {
            agents[i].draw();
        }
    }
    if (drawMouse)
        drawMouseHexagon();
    if (drawLines) {
        for (var y = 0; y < rows; y++) {
            for (var x = 0; x < columns; x++) {
                hexagons[x][y].drawLines();
            }
        }
    }
    update();
}
function update() {
    mousePos.x = mouseX;
    mousePos.y = mouseY;
    if (agentsMoving) {
        for (var i = 0; i < creatorCount + destroyerCount; i++) {
            agents[i].update();
        }
    }
    for (var y = 0; y < rows; y++) {
        for (var x = 0; x < columns; x++) {
            hexagons[x][y].update();
        }
    }
}
var Agent = (function () {
    function Agent(creator) {
        this.x = Math.round(columns * (0.3 + random(0.4)));
        this.y = Math.round(rows * (0.3 + random(0.4)));
        this.dir = Math.floor(random(0, 6));
        this.creator = creator;
    }
    Agent.prototype.draw = function () {
        noStroke();
        if (this.creator) {
            fill(255, 30);
        }
        else {
            fill(255, 0, 100, 40);
        }
        drawHexagon(hexagons[this.x][this.y].pixelPos);
    };
    Agent.prototype.update = function () {
        var curHex = hexagons[this.x][this.y];
        if (this.creator) {
            if (curHex.nextActive < 2) {
                curHex.nextActive++;
            }
        }
        else {
            if (curHex.nextActive > 0) {
                curHex.nextActive--;
            }
        }
        this.dir += -1 + Math.floor(random(3));
        this.dir = wrap6(this.dir);
        var nextHex = curHex.neighbours[this.dir];
        if (nextHex === false) {
            this.dir = wrap6(this.dir + 3);
            nextHex = curHex.neighbours[this.dir];
            if (nextHex === false)
                return;
        }
        this.x = nextHex.pos.x;
        this.y = nextHex.pos.y;
    };
    return Agent;
}());
var Hex = (function () {
    function Hex(x, y) {
        this.pos = createVector(x, y);
        this.pixelPos = createVector(0, 0);
        this.pixelPos.x = hexWidth * (1.5 * x + 0.5 + y % 2 * 0.75);
        this.pixelPos.y = hexHeight * (y * 0.5 + 0.5);
        this.active = 0;
        this.nextActive = 0;
        this.neighbours = [];
        this.denseLayout = Math.ceil(random(3));
        this.zenosNeighbours = 0;
    }
    Hex.prototype.initialiseNeighbours = function (x, y) {
        var n = [false, false, false, false, false, false];
        var odd = y % 2;
        if (y >= 2) {
            n[0] = hexagons[x][y - 2];
        }
        if (y >= 1) {
            if (!odd || x < columns - 1) {
                n[1] = hexagons[x + odd][y - 1];
            }
        }
        if (y < rows - 1) {
            if (!odd || x < columns - 1) {
                n[2] = hexagons[x + odd][y + 1];
            }
        }
        if (y < rows - 2) {
            n[3] = hexagons[x][y + 2];
        }
        if (y < rows - 1) {
            if (odd || x >= 1) {
                n[4] = hexagons[x - 1 + odd][y + 1];
            }
        }
        if (y >= 1) {
            if (odd || x >= 1) {
                n[5] = hexagons[x - 1 + odd][y - 1];
            }
        }
        this.neighbours = n;
    };
    Hex.prototype.update = function () {
        if (!this.active && this.nextActive) {
            this.denseLayout = (this.denseLayout == 3) ? 1 : this.denseLayout + 1;
        }
        this.active = this.nextActive;
        if (this.zenosNeighbours == 0) {
            this.zenosNeighbours = this.countActiveNeighbours() + this.active;
        }
        else {
            this.zenosNeighbours = this.zenosNeighbours * (1 - zenoSway) + zenoSway * (this.countActiveNeighbours() + this.active);
        }
        if (mousePos.dist(this.pixelPos) < hexRadius) {
            mouseTargetHex = this;
        }
    };
    Hex.prototype.countActiveNeighbours = function () {
        var activeNeighbours = 0;
        for (var i = 0; i < 6; i++) {
            if (this.neighbours[i] && this.neighbours[i].active) {
                activeNeighbours++;
            }
        }
        return activeNeighbours;
    };
    Hex.prototype.getActiveNeighbours = function () {
        var activeNeighbours = [];
        for (var i = 0; i < 6; i++) {
            if (this.neighbours[i] && this.neighbours[i].active) {
                activeNeighbours.push(true);
            }
            else {
                activeNeighbours.push(false);
            }
        }
        return activeNeighbours;
    };
    Hex.prototype.drawHex = function () {
        noStroke();
        fill(0);
        var brightness = this.zenosNeighbours;
        if (drawHex && this.active) {
            fill(5 * brightness, 6 * Math.pow(brightness, 1.6), 16 * brightness);
        }
        drawHexagon(this.pixelPos);
    };
    Hex.prototype.drawLines = function () {
        push();
        translate(this.pixelPos.x, this.pixelPos.y);
        if (this.active) {
            var activeNeighboursCount = this.countActiveNeighbours();
            var activeNeighbours = this.getActiveNeighbours();
            stroke(255);
            strokeWeight(hexLineWeight);
            noFill();
            if (activeNeighboursCount == 0) {
                if (drawPoints && this.active == 2) {
                    ellipse(0, 0, hexDoubleLineOffset);
                }
            }
            else if (activeNeighboursCount == 1) {
                var activeEdge = activeNeighbours.indexOf(true);
                var activeNeighbour = this.neighbours[activeEdge];
                if (activeNeighbour.active == 2 ||
                    this.active == 2) {
                    if (drawPoints || activeNeighbour.countActiveNeighbours() > 1) {
                        var pos1 = getEdgePos(activeEdge, 1);
                        var pos2 = getEdgePos(activeEdge, -1);
                        var control1 = createVector(hexDoubleLineOffset * 0.5, -hexHeight / 2 + hexDoubleLineOffset).rotate(activeEdge * Math.PI / 3);
                        var control2 = createVector(-hexDoubleLineOffset * 0.5, -hexHeight / 2 + hexDoubleLineOffset).rotate(activeEdge * Math.PI / 3);
                        beginShape();
                        vertex(pos1.x, pos1.y);
                        bezierVertex(control1.x, control1.y, control2.x, control2.y, pos2.x, pos2.y);
                        endShape();
                    }
                }
            }
            else if (activeNeighboursCount == 2 || activeNeighboursCount == 3) {
                for (var i = 0; i < 6; i++) {
                    if (activeNeighbours[i]) {
                        for (var j = i + 1; j < 6; j++) {
                            if (activeNeighbours[j]) {
                                this.drawCurveBetweenEdges(i, j);
                            }
                        }
                    }
                }
            }
            else if (activeNeighboursCount == 4) {
                var skipped1 = activeNeighbours.indexOf(false);
                var skipped2 = activeNeighbours.slice(skipped1 + 1).indexOf(false) + skipped1 + 1;
                var positions = [];
                var skippedClockwise = (skipped1 == 0) ? skipped1 : skipped2;
                for (var i_1 = skippedClockwise; i_1 < skippedClockwise + 6; i_1++) {
                    if (wrap6(i_1) != skipped1 && wrap6(i_1) != skipped2) {
                        positions.push(wrap6(i_1));
                    }
                }
                if ((skipped2 == wrap6(skipped1 + 1))
                    || (skipped1 == 0 && skipped2 == 5)) {
                    if (this.denseLayout == 3) {
                        this.drawCurveBetweenEdges(positions[0], positions[1]);
                        this.drawCurveBetweenEdges(positions[1], positions[2]);
                        this.drawCurveBetweenEdges(positions[2], positions[3]);
                    }
                    else if (this.denseLayout == 2) {
                        this.drawCurveBetweenEdges(positions[0], positions[2]);
                        this.drawCurveBetweenEdges(positions[1], positions[3]);
                    }
                    else {
                        this.drawCurveBetweenEdges(positions[0], positions[1]);
                        this.drawCurveBetweenEdges(positions[2], positions[3]);
                    }
                }
                else {
                    if (this.denseLayout == 3) {
                        this.drawCurveBetweenEdges(positions[0], positions[1]);
                        this.drawCurveBetweenEdges(positions[1], positions[2]);
                        this.drawCurveBetweenEdges(positions[2], positions[3]);
                        this.drawCurveBetweenEdges(positions[3], positions[0]);
                    }
                    else if (this.denseLayout == 2) {
                        this.drawCurveBetweenEdges(positions[3], positions[0]);
                        this.drawCurveBetweenEdges(positions[1], positions[2]);
                    }
                    else {
                        this.drawCurveBetweenEdges(positions[0], positions[1]);
                        this.drawCurveBetweenEdges(positions[2], positions[3]);
                    }
                }
            }
            else if (activeNeighboursCount == 5) {
                var skipped = activeNeighbours.indexOf(false);
                if (this.denseLayout == 3) {
                    for (var i = skipped; i < 5 + skipped; i++) {
                        var edge1 = (i == skipped) ? i + 5 : i;
                        this.drawCurveBetweenEdges(edge1, i + 1);
                    }
                }
                else if (this.denseLayout == 2) {
                    this.drawCurveBetweenEdges(skipped + 1, skipped + 5);
                    this.drawCurveBetweenEdges(skipped + 2, skipped + 3);
                    this.drawCurveBetweenEdges(skipped + 3, skipped + 4);
                }
                else if (this.denseLayout == 1) {
                    this.drawCurveBetweenEdges(skipped + 1, skipped + 3);
                    this.drawCurveBetweenEdges(skipped + 5, skipped + 3);
                    this.drawCurveBetweenEdges(skipped + 1, skipped + 2);
                    this.drawCurveBetweenEdges(skipped + 5, skipped + 4);
                }
            }
            else {
                if (this.denseLayout == 3) {
                    for (var i = 0; i < 6; i++) {
                        this.drawCurveBetweenEdges(i, i + 1);
                    }
                }
                else {
                    for (var i = this.denseLayout - 1; i < 6; i += 2) {
                        this.drawCurveBetweenEdges(i, i + 1);
                    }
                }
            }
        }
        pop();
    };
    Hex.prototype.drawCurveBetweenEdges = function (edge1, edge2) {
        edge1 = wrap6(edge1);
        edge2 = wrap6(edge2);
        var double = false;
        if (this.active == 2)
            double = true;
        if ((this.neighbours[edge1] && this.neighbours[edge1].active == 2) &&
            (this.neighbours[edge2] && this.neighbours[edge2].active == 2)) {
            double = true;
        }
        if (double) {
            this.drawCurveWithOffset(edge1, edge2, 1, 1, -hexDoubleLineOffset * 0.8);
            this.drawCurveWithOffset(edge1, edge2, -1, -1, hexDoubleLineOffset * 0.5);
        }
        else {
            if ((this.neighbours[edge1] && this.neighbours[edge1].active == 2)) {
                this.drawCurveWithOffset(edge1, edge2, 1, 0, -hexDoubleLineOffset * 0.4);
                this.drawCurveWithOffset(edge1, edge2, -1, 0, hexDoubleLineOffset * 0.25);
            }
            else if ((this.neighbours[edge2] && this.neighbours[edge2].active == 2)) {
                this.drawCurveWithOffset(edge1, edge2, 0, 1, -hexDoubleLineOffset * 0.4);
                this.drawCurveWithOffset(edge1, edge2, 0, -1, hexDoubleLineOffset * 0.25);
            }
            else {
                this.drawCurveWithOffset(edge1, edge2, 0, 0);
            }
        }
    };
    Hex.prototype.drawCurveWithOffset = function (edge1, edge2, offset1, offset2, originOffset) {
        var origin = createVector(0, 0);
        if (originOffset) {
            origin.y = originOffset;
        }
        var pos1 = getEdgePos(edge1, offset1);
        var pos2 = getEdgePos(edge2, offset2);
        if (edge1 == wrap6(edge2 - 1)) {
            pos2 = getEdgePos(edge2, -offset2);
            origin.y -= hexRadius * 0.25;
            origin.rotate((edge1 + 0.5) * Math.PI / 3);
        }
        else if (edge1 == wrap6(edge2 + 1)) {
            pos1 = getEdgePos(edge1, -offset1);
            origin.y -= hexRadius * 0.25;
            origin.rotate((edge1 - 0.5) * Math.PI / 3);
        }
        else if (edge1 == wrap6(edge2 - 2)) {
            pos2 = getEdgePos(edge2, -offset2);
            origin.rotate((edge1 + 1) * Math.PI / 3);
        }
        else if (edge1 == wrap6(edge2 + 2)) {
            pos1 = getEdgePos(edge1, -offset1);
            origin.rotate((edge1 - 1) * Math.PI / 3);
        }
        if (Math.abs(edge2 - edge1) == 3) {
            pos2 = getEdgePos(edge2, -offset2);
            origin.y = (hexDoubleLineOffset * 0.5) * (offset1 + offset2) * 0.5 * (edge1 - edge2) / 3;
            origin.rotate((edge1 + 1.5) * Math.PI / 3);
        }
        beginShape();
        vertex(pos1.x, pos1.y);
        quadraticVertex(origin.x, origin.y, pos2.x, pos2.y);
        endShape();
    };
    return Hex;
}());
function drawMouseHexagon() {
    fill(255, 50);
    if (mouseTargetHex && mouseOnScreen()) {
        drawHexagon(mouseTargetHex.pixelPos);
    }
}
function mousePressed() {
    if (mouseTargetHex && mouseOnScreen()) {
        if (mouseButton == LEFT) {
            mouseTargetHex.nextActive = (mouseTargetHex.nextActive + 1) % 3;
        }
        else if (mouseButton == RIGHT) {
            mouseTargetHex.nextActive = (mouseTargetHex.nextActive - 1) % 3;
        }
        mouseLastHex = mouseTargetHex;
    }
}
function mouseDragged() {
    if (mouseTargetHex && mouseOnScreen()
        && mouseTargetHex.nextActive == mouseTargetHex.active
        && mouseLastHex != mouseTargetHex) {
        if (mouseButton == LEFT && mouseTargetHex.nextActive < 2) {
            mouseTargetHex.nextActive++;
        }
        else if (mouseButton == RIGHT && mouseTargetHex.nextActive > 0) {
            mouseTargetHex.nextActive--;
        }
        mouseLastHex = mouseTargetHex;
    }
}
function keyPressed() {
    if (keyCode == 32) {
        agentsMoving = !agentsMoving;
    }
    if (keyCode == 87) {
        for (var x = 0; x < columns; x++) {
            for (var y = 0; y < rows; y++) {
                hexagons[x][y].nextActive = false;
            }
        }
    }
    if (keyCode == 81) {
        creatorCount = 0;
        destroyerCount = 0;
        agents = [];
    }
    if (keyCode == 84) {
        drawAgents = !drawAgents;
    }
    if (keyCode == 77) {
        drawMouse = !drawMouse;
    }
    if (keyCode == 72) {
        drawHex = !drawHex;
    }
    if (keyCode == 71) {
        drawGrid = !drawGrid;
    }
    if (keyCode == 67) {
        creatorCount++;
        agents.push(new Agent(true));
    }
    if (keyCode == 68) {
        destroyerCount++;
        agents.push(new Agent(false));
    }
}
