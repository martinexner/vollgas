import { CombinedGraphicalElement } from "./CombinedGraphicalElement";
import { GraphicalNor } from "./GraphicalNor";
import { GraphicalWire } from "./GraphicalWire";
import { GrammarParser } from "../grammar/GrammarParser";
import { StubGraphicalElement } from "./StubGraphicalElement";
import { GraphicalDFlipFlop } from "./GraphicalDFlipFlop";
import { GraphicalOr } from "./GraphicalOr";

export class GraphicalMicro16Registers extends CombinedGraphicalElement {

    constructor(name: string) {

        const wireDist = GraphicalWire.DEFAULT_DISTANCE;
        const busDist = 10;

        const decoderHeight = (16+1)*wireDist;

        const regWidth = Math.floor(GraphicalOr.getWidth(GraphicalOr.DEFAULT_HEIGHT));
        const regHeight = Math.floor(GraphicalOr.DEFAULT_HEIGHT / 2);
        const regDist = 2*GraphicalWire.DEFAULT_HEIGHT;

        const displaySplitHeight = Math.floor(regHeight / 4);

        const muxHeight = 16*regHeight + 15*regDist;
        const muxWidth = Math.floor(GraphicalOr.getWidth(GraphicalOr.DEFAULT_HEIGHT));

        const sSplitsX = 18*wireDist;

        const regsX = sSplitsX + busDist;
        const regsAfterX = regsX + regWidth;
        const regsY = decoderHeight + GraphicalOr.DEFAULT_ELEMENT_SPACE + 4*wireDist;

        const regSplitsX = regsAfterX + 2*regWidth;

        const sDecMuxX = regsX;
        const sDecX = sDecMuxX + 2*regWidth;

        const aMuxX = regsX + regWidth + 2*regWidth + 17*busDist + 18*wireDist;
        const aMuxY = regsY;

        const bDecY = aMuxY + muxHeight + GraphicalOr.DEFAULT_ELEMENT_SPACE;

        const bMuxX = aMuxX;
        const bMuxY = bDecY + decoderHeight + GraphicalOr.DEFAULT_ELEMENT_SPACE;

        const totalHeight = bMuxY + muxHeight;

        let elements: string[] = [];

        let regEnableWires: string[] = [];
        let aMuxEnableWires: string[] = [];
        let bMuxEnableWires: string[] = [];

        elements.push(`amux mux overrideHeight=${muxHeight} @${aMuxX}:${aMuxY} 0+15>>`);

        elements.push(`bmux mux overrideHeight=${muxHeight} @${bMuxX}:${bMuxY} 0+15>>`);

        for(let i = 0; i < 16; i++) {

            elements.push(`reg_split${i} split @${regSplitsX + (16-i)*busDist}:amux/i${i*17 + 7} 0+15>amux/i${i*17} 16+15>p:n~bmux/i${i*17}`);

            let readOnlyParams = "";
            if(i <= 2) {
                readOnlyParams = ` readOnly=true initHex=${["0000", "0001", "FFFF"][i]}`;
            }

            elements.push(`reg${i} reg overrideHeight=${regHeight}${readOnlyParams} o7@${regsAfterX}:reg_split${i}/i0 0+15>display_split${i}`);

            elements.push(`display_split${i} split overrideHeight=${displaySplitHeight} line=true displayValue=belowRight i7@reg${i}/o7+${2*wireDist}:reg${i}/o7 0+15>reg_split${i}`);

            if(i === 4) {
                elements.push(`s_split${i} split @${sSplitsX}:reg${i}/i7 0+15>reg${i} 16+15>p:n~reg${i-1}`);
            } else if(i > 4) {
                elements.push(`s_split${i} split @${sSplitsX}:reg${i}/i7` + ((i < 15) ? "" : " <0+15") + ` 0+15>reg${i} 16+15>s_split${i-1}`);
            }

            if(i > 2) {
                regEnableWires.push(`${15-i}>p-${(i+2)*wireDist + busDist}:p~p:n~reg${i}/i16`);
            }

            aMuxEnableWires.push(`${15-i}>p-${(i+2)*wireDist}:p~p:n~amux/i${((i+1)*17)-1}`);

            bMuxEnableWires.push(`${15-i}>p-${(i+2)*wireDist}:p~p:n~bmux/i${((i+1)*17)-1}`);

        }

        elements.push(`s_dec_mux mux numOutBits=16 numInChannels=1 mirrorConnectors=true overrideHeight=${decoderHeight} @${sDecMuxX}:0 16<16 ${regEnableWires.join(" ")}`);

        elements.push(`s_dec decoder mirrorConnectors=true overrideHeight=${decoderHeight} o7@${sDecX}:s_dec_mux/i7 <17+3 0+15>s_dec_mux`);

        elements.push(`a_dec decoder mirrorConnectors=true overrideHeight=${decoderHeight} @${aMuxX}:0 <21+3 ${aMuxEnableWires.join(" ")}`);

        elements.push(`b_dec decoder mirrorConnectors=true overrideHeight=${decoderHeight} @${bMuxX}:${bDecY} <25+3 ${bMuxEnableWires.join(" ")}`);

        super(name, totalHeight, GrammarParser.parse(elements).wiringDescriptions);

    }

}