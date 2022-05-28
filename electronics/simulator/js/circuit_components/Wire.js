import { currMouseAction } from "../menutools.js"
import { MouseAction, INPUT_STATE } from "./Enums.js";
import { colorMouseOver, fileManager } from "../simulator.js";

/**
 * @classdesc 
 */
export class Wire {

    /**
     * @constructor 
     * @param {Node} startNode 
     */
    constructor(startNode) {
        this.startNode = startNode;
        this.endNode = null;
        this.startID = startNode.id;
        this.endID = null;
        this.endX = mouseX;
        this.endY = mouseY;
        this.width = 8;
    }
    destroy() {
        this.startNode.setInputState(INPUT_STATE.FREE);
        if (this.endNode == null)
            return;
        this.endNode.setValue(false);
        this.endNode.setInputState(INPUT_STATE.FREE);
    }
    draw() {
        stroke(0);
        strokeWeight(this.width / 2);
        if (this.endNode == null) {
            if (!this.startNode.isAlive)
                return false; 
            line(this.startNode.posX, this.startNode.posY,
                mouseX, mouseY);
        } else if (this.startNode.isAlive && this.endNode.isAlive) {
            this.generateNodeValue();
            noFill();
            if (this.isMouseOver())
                stroke(colorMouseOver[0], colorMouseOver[1], colorMouseOver[2]);
            else
                stroke(0);
            bezier(this.startNode.posX, this.startNode.posY,
                this.startNode.posX + 50, this.startNode.posY,
                this.endNode.posX - 50, this.endNode.posY,
                this.endNode.posX, this.endNode.posY);
            if (this.startNode.getValue() && this.endNode.getValue()) {
                strokeWeight(1);
                stroke(255, 193, 7);
                bezier(this.startNode.posX, this.startNode.posY,
                    this.startNode.posX + 50, this.startNode.posY,
                    this.endNode.posX - 50, this.endNode.posY,
                    this.endNode.posX, this.endNode.posY);
            }
        } else {
            this.endNode.setValue(false);
            return false; // destroy the wire
        }
        return true;
    }
    /**
     * @todo TODO
     */
    generateNodeValue() {
        if ((this.startNode.isOutput && this.endNode.isOutput) ||
            (!this.startNode.isOutput && !this.endNode.isOutput)) {
            // short circuit         
            this.startNode.setValue(this.startNode.getValue() ||
                this.endNode.getValue());
            this.endNode.setValue(this.startNode.getValue());
        } else {
            this.endNode.setValue(this.startNode.getValue());
        }
    }
    /**
     * @returns {Boolean}
     */
    isMouseOver() {
        if (!this.startNode.isAlive || !this.endNode.isAlive)
            return false;
        let distance = [];
        distance.push(dist(this.startNode.posX, this.startNode.posY,
            mouseX, mouseY));
        distance.push(dist(this.endNode.posX, this.endNode.posY,
            mouseX, mouseY));
        const wireLength = dist(this.startNode.posX, this.startNode.posY,
            this.endNode.posX, this.endNode.posY);
        if (distance[0] + distance[1] >= wireLength - (this.width / (10 * 2)) &&
            distance[0] + distance[1] <= wireLength + (this.width / (10 * 2)))
            return true;
        return false;
    }
    /**
     * @returns {Node} 
     */
    getStartNode() {
        return this.startNode;
    }
    /**
     * @param {number} endX 
     * @param {number} endY 
     */
    updateEnd(endX, endY) {
        this.endX = endX;
        this.endY = endY;
    }
    /**
     * @param {Node} endNode
     */
    setEndNode(endNode) {
        if (endNode.isOutput) {
            let tempNode = this.startNode;
            this.startNode = endNode;
            this.endNode = tempNode;
            this.endNode.setInputState(INPUT_STATE.TAKEN);
        } else {
            this.endNode = endNode;
            this.startNode.setInputState(INPUT_STATE.TAKEN);
            this.endNode.setInputState(INPUT_STATE.TAKEN);
        }
        this.startID = this.startNode.id;
        this.endID = this.endNode.id;
    }

}

/**
 * @classdesc 
 * @todo
 */
class ShortCircuit {
    /**
     * @todo 
     */
    constructor(startNode, endNode) {
        this.firstNode = startNode;
        this.secondNode = endNode;
        this.inputNode = new Node(this.firstNode.posX - 10,
            (this.firstNode.posY + this.secondNode.posY) / 2);
        this.firstNode.setInputState(INPUT_STATE.TAKEN);
        this.secondNode.setInputState(INPUT_STATE.TAKEN);
    }
    /**
     * @todo 
     */
    destroy() {
        this.inputNode.destroy();
        delete this.inputNode;
    }
    /**
     * @todo 
     */
    draw() {
        stroke(0);
        strokeWeight(2);
        if (this.firstNode.isAlive && this.secondNode.isAlive) {
            this.drawShortCircuit();
            this.inputNode.draw();
            this.firstNode.setValue(this.inputNode.getValue());
            this.secondNode.setValue(this.inputNode.getValue());
        } else {
            this.firstNode.setValue(false);
            this.secondNode.setValue(false);
            return false;
        }
        return true;
    }
    /**
     * @todo 
     */
    drawShortCircuit() {
        let posCommonNode = [
            this.firstNode.posX - 15,
            (this.firstNode.posY + this.secondNode.posY) / 2
        ];
        this.inputNode.updatePosition(posCommonNode[0], posCommonNode[1]);
        line(this.firstNode.posX, this.firstNode.posY,
            posCommonNode[0], this.firstNode.posY);
        line(this.secondNode.posX, this.secondNode.posY,
            posCommonNode[0], this.secondNode.posY);
        line(posCommonNode[0], this.firstNode.posY,
            posCommonNode[0], this.secondNode.posY);
    }
    mouseClicked() {
        this.inputNode.mouseClicked();
    }
}

/**
 * @classdesc
 */
export class WireManager {
    /**
     * @todo
     */
    constructor() {
        this.wire = [];
        this.shortCircuit = [];
        this.isOpened = false;
    }
    draw() {
        for (let i = 0; i < this.wire.length; i++) {
            let result = this.wire[i].draw();
            if (result == false)
            {
                this.isOpened = false;
                if (this.wire[i] != null)
                    this.wire[i].destroy();
                delete this.wire[i];
                this.wire.splice(i, 1);
            }
        }
        for (let i = 0; i < this.shortCircuit.length; i++) {
            let result = this.shortCircuit[i].draw();
            if (result == false) 
            {
                this.isOpened = false;
                this.shortCircuit[i].destroy();
                delete this.shortCircuit[i];
                this.shortCircuit.splice(i, 1);
            }
        }
    }
    /**
     * @todo 
     * @param {Node} node 
     */
    addNode(node) {
        if (this.isOpened == false) {
            this.wire.push(new Wire(node));
            this.isOpened = true;
            document.getElementById("canvas-sim").style.cursor = "crosshair";
        } else {
            let index = this.wire.length - 1;
            if (node != this.wire[index].getStartNode() &&
                (this.wire[index].getStartNode().isOutput != node.isOutput ||
                    node.getBrother() == this.wire[index].getStartNode())) {
                if (node == this.wire[index].getStartNode().getBrother()) {
                    this.shortCircuit.push(new ShortCircuit(this.wire[index].getStartNode(), node));

                    delete this.wire[index];
                    this.wire.length--;
                } else {
                    this.wire[index].setEndNode(node);
                    fileManager.saveState();
                }
            } else {
                delete this.wire[index];
                this.wire.length--;
            }
            this.isOpened = false;
            document.getElementById("canvas-sim").style.cursor = "default";
        }
    }
    mouseClicked() {
        if (currMouseAction == MouseAction.DELETE) {
            for (let i = 0; i < this.wire.length; i++) {
                if (this.wire[i].isMouseOver()) {
                    this.wire[i].destroy();
                    delete this.wire[i];
                    this.wire.splice(i, 1);
                }
            }
        }
        for (let i = 0; i < this.shortCircuit.length; i++) {
            this.shortCircuit[i].mouseClicked();
        }
    }
}