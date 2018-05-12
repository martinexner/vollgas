import { CombinedGraphicalElement } from "./CombinedGraphicalElement";
import { GraphicalNor } from "./GraphicalNor";
import { GraphicalWire } from "./GraphicalWire";
import { GrammarParser } from "../grammar/GrammarParser";
import { StubGraphicalElement } from "./StubGraphicalElement";
import { GraphicalDFlipFlop } from "./GraphicalDFlipFlop";
import { GraphicalOr } from "./GraphicalOr";

export class GraphicalMicro16 extends CombinedGraphicalElement {

    constructor(name: string, code: string, instructionDelay?: number, aluDelay?: number, registersDelay?: number) {

        let elements: string[] = [];

        const wireDist = GraphicalWire.DEFAULT_DISTANCE;
        const busDist = 10;

        const elemWidth = GraphicalOr.getWidth(GraphicalOr.DEFAULT_HEIGHT);
        const elemHeight = GraphicalOr.DEFAULT_HEIGHT;

        const micX = 450;
        const aluX = micX;
        const clockX = 1100;
        const storeX = aluX + 900;
        const instRegX = storeX + 4*busDist;

        const micY = 100;
        const storeY = 50;
        const clockY = 100;
        const aluY = 260;
        const aBusY = aluY - 2*busDist + busDist;
        const bBusY = aluY - 3*busDist + busDist;
        const storeAfterY = storeY + 4*GraphicalOr.DEFAULT_HEIGHT + wireDist;

        elements.push(`regs micro16regs @0:60 0+15>p+${2*busDist+6*wireDist}:p~p:${aBusY}~n:p~n+${busDist}:n~alu/i0 16+15>p+${busDist}:p~p:${bBusY}~n:p~n+${2*busDist}:n~alu/i16`);

        elements.push(`alu micro16alu @${aluX}:${aluY} 0+15>p-${busDist}:p~p:p+50~n:p~regs/i0 16>p+${2*elemWidth+2*wireDist}:p~p:${storeAfterY+4*wireDist}~n:p~mic/i9`);

        elements.push(`mic micro16mic @${micX}:${micY} 0+7>p:${storeAfterY+2*busDist}~n:p~n-${busDist}:n~store`);

        let delayParams = `${(instructionDelay !== undefined) ? ` instructionDelay=${instructionDelay}` : ""}${(aluDelay !== undefined) ? ` aluDelay=${aluDelay}` : ""}${(registersDelay !== undefined) ? ` registersDelay=${registersDelay}` : ""}`;

        elements.push(`clock micro16clock${delayParams} @${clockX}:${clockY}
>p+${6*wireDist}:p~p:n~n:n+${2*wireDist}~n-${2*wireDist}:n~instruction_reg/i32
>p+${4*wireDist}:p~p:instruction_reg/i32+${4*wireDist}~n:p~alu/o16+${2*elemWidth+0*wireDist}:n~alu/i32
>p+${2*wireDist}:p~p:p+${elemHeight}~p-${elemWidth+4*wireDist}:p~p:n~s_mic_enable_split`);

        elements.push(`store micro16store code=${code} @${storeX}:${storeY} 0+31>instruction_reg`);

        elements.push(`instruction_reg reg overrideHeight=${4*GraphicalOr.DEFAULT_HEIGHT} i15@${instRegX}:store/o15
1>n:p~alu/o16+${2*elemWidth+7*wireDist}:n~n:n-${elemHeight}~n-${2*wireDist}:n~alu/i37
2>n:p~alu/o16+${2*elemWidth+8*wireDist}:n~n:n+${elemHeight}~n-${2*wireDist}:n~alu/i38
3>n:p~alu/o16+${2*elemWidth+5*wireDist}:n~alu/i34
4>n:p~alu/o16+${2*elemWidth+4*wireDist}:n~alu/i33
5>n:p~alu/o16+${2*elemWidth+10*wireDist}:n~alu/i35
6>n:p~alu/o16+${2*elemWidth+11*wireDist}:n~alu/i36
12>p+${2*wireDist}:p~p:n~n:regs/i17-${elemHeight+2*busDist+2*wireDist}~n+${5*wireDist}:n~regs/i20
13>p+${3*wireDist}:p~p:n~n:regs/i17-${elemHeight+2*busDist+3*wireDist}~n+${4*wireDist}:n~regs/i19
14>p+${4*wireDist}:p~p:n~n:regs/i17-${elemHeight+2*busDist+4*wireDist}~n+${3*wireDist}:n~regs/i18
15>p+${5*wireDist}:p~p:n~n:regs/i17-${elemHeight+2*busDist+5*wireDist}~n+${2*wireDist}:n~regs/i17
16>p+${7*wireDist}:p~p:n~n:regs/i21-${elemHeight+2*busDist-8*wireDist}~n+${10*wireDist}:n~regs/i28
17>p+${8*wireDist}:p~p:n~n:regs/i21-${elemHeight+2*busDist-7*wireDist}~n+${9*wireDist}:n~regs/i27
18>p+${9*wireDist}:p~p:n~n:regs/i21-${elemHeight+2*busDist-6*wireDist}~n+${8*wireDist}:n~regs/i26
19>p+${10*wireDist}:p~p:n~n:regs/i21-${elemHeight+2*busDist-5*wireDist}~n+${7*wireDist}:n~regs/i25
20>p+${12*wireDist}:p~p:n~n:regs/i21-${elemHeight+2*busDist-3*wireDist}~n+${5*wireDist}:n~regs/i24
21>p+${13*wireDist}:p~p:n~n:regs/i21-${elemHeight+2*busDist-2*wireDist}~n+${4*wireDist}:n~regs/i23
22>p+${14*wireDist}:p~p:n~n:regs/i21-${elemHeight+2*busDist-1*wireDist}~n+${3*wireDist}:n~regs/i22
23>p+${15*wireDist}:p~p:n~n:regs/i21-${elemHeight+2*busDist-0*wireDist}~n+${2*wireDist}:n~regs/i21
24+7>p+${busDist}:p~p:${storeAfterY+3*busDist}~n:p~n+${2*busDist+wireDist}:n~mic/i0`);

        elements.push(`s_mic_enable_split split @mic/i8+${2*wireDist}:${micY-2*busDist} >p:n~mic/i8 >regs/i25+${12*wireDist}:p~p:n~n:n+${3*wireDist}~n+${2*wireDist}:n~regs/i16`);

        super(name, 600, GrammarParser.parse(elements).wiringDescriptions);

    }

}