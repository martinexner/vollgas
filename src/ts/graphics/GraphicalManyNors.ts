import { CompactCombinedGraphicalElement } from "./CompactCombinedGraphicalElement";
import { StubGraphicalElement } from "./StubGraphicalElement";
import { CombinedGraphicalElement } from "./CombinedGraphicalElement";
import { GraphicalOr } from "./GraphicalOr";
import { GraphicalWire } from "./GraphicalWire";
import { GrammarParser } from "../grammar/GrammarParser";
import { GraphicalNor } from "./GraphicalNor";

export class GraphicalManyNors extends CombinedGraphicalElement {

    constructor(name: string, num: number) {

        let elements: string[] = [];

        const elemDist = GraphicalOr.DEFAULT_ELEMENT_SPACE;

        for(let i = 0; i < num; i++) {
            elements.push(`nor${i} nor @${i > 0 ? `nor${i-1}/o0+${elemDist}` : "0"}:0${i <= 0 ? " <0" : ""} ${(i+1) >= num ? "0>>" : `>nor${i+1}`}`);
        }

        super(name, GraphicalNor.DEFAULT_HEIGHT, GrammarParser.parse(elements).wiringDescriptions);

    }

}