pragma circom 2.0.0;

// [assignment] Modify the circuit below to perform a multiplication of three signals

//　this circuit multiply input1 and input2
template Multiplier2 () {
   //Declaration of signals.
   signal input in1;
   signal input in2;
   signal output out;
   
   //Statements.
   out <== in1 * in2;
}

//This circuit multiplies in1, in2, and in3 using Multiplier2
template Multiplier3 () {
   //Declaration of signals and components.
   signal input in1;
   signal input in2;
   signal input in3;
   signal output out;
   component mul1 = Multiplier2();
   component mul2 = Multiplier2();

   mul1.in1 <== in1;
   mul1.in2 <== in2;
   mul2.in1 <== mul1.out;
   mul2.in2 <== in3;
   out <== mul2.out;
}

component main = Multiplier3();