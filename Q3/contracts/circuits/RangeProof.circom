pragma circom 2.0.0;

include "/home/magu/week1/recursive/Q3/projects/zkPuzzles/node_modules/circomlib/circuits/comparators.circom";
template Multiplier2(){
    signal input in1;
    signal input in2;
    signal output out;

    out <==in1 * in2;
}

template RangeProof(n) {
    assert(n <= 252);
    signal input in; // this is the number to be proved inside the range
    signal input range[2]; // the two elements should be the range, i.e. [lower bound, upper bound]
    signal output out;

    component lt = LessEqThan(n);
    component gt = GreaterEqThan(n);
    component mult =Multiplier2();

    lt.in[0] <== in;
    lt.in[1] <== range[1];
    
    gt.in[0] <== in;
    gt.in[1] <== range[0];

    mult.in1 <== lt.out;
    mult.in2 <== gt.out;
    out <== mult.out;
}