const { expect, assert } = require("chai");// make assert assertions available
const { ethers } = require("hardhat");//import ethers
const { groth16 } = require("snarkjs");//import groth16
const { plonk } =require("snarkjs");

const wasm_tester = require("circom_tester").wasm;//tools for testing circom circuits

const F1Field = require("ffjavascript").F1Field;//import finitefield library
const Scalar = require("ffjavascript").Scalar;//import BN254 curve scalar field
exports.p = Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617");//return Bigint
const Fr = new F1Field(exports.p);//create new instance

describe("HelloWorld", function () {// test helloworld
    this.timeout(100000000);//timeout here at 100000000ms
    let Verifier;//declaration Verifier
    let verifier;//declaration verifier

    beforeEach(async function () { //Starts once before every it() in describe helloworld
        Verifier = await ethers.getContractFactory("HelloWorldVerifier");//This will actually compile contract and generate the necessary files 
        verifier = await Verifier.deploy();//deploy contract on local network
        await verifier.deployed();//wait until contract is deployed
    });

    it("Circuit should multiply two numbers correctly", async function () {//test multiply two numbers
        const circuit = await wasm_tester("contracts/circuits/HelloWorld.circom");// call wasm_tester function

        const INPUT = {
            "a": 2,
            "b": 3
        }//declaration INPUT

        const witness = await circuit.calculateWitness(INPUT, true);//calucutate witness

        //console.log(witness);

        assert(Fr.eq(Fr.e(witness[0]),Fr.e(1)));//Checking values with the assert statement
        assert(Fr.eq(Fr.e(witness[1]),Fr.e(6)));//Checking values with the assert statement

    });

    it("Should return true for correct proof", async function () {
        //[assignment] Add comments to explain what each line is doing
        const { proof, publicSignals } = await groth16.fullProve({"a":"2","b":"3"}, "contracts/circuits/HelloWorld/HelloWorld_js/HelloWorld.wasm","contracts/circuits/HelloWorld/circuit_final.zkey");
        //Proof and Output Calculations

        console.log('2x3 =',publicSignals[0]);
        //Outputs publicsignals[0] to console
        
        const calldata = await groth16.exportSolidityCallData(proof, publicSignals);
        //export proof and publicSignals as solidity calldata
        const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());
        //calldata.replace(/["[]\s]/g, "") is replacing " or [ or ] or spaces with an enpty letter and split it with ',' ,then convert each of them into Bigint
        const a = [argv[0], argv[1]];
        const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
        const c = [argv[6], argv[7]];
        const Input = argv.slice(8);
        //Argument Assignment
        expect(await verifier.verifyProof(a, b, c, Input)).to.be.true;
        //Smart contracts verify that the proof is correct
    });
    it("Should return false for invalid proof", async function () {
        let a = [0, 0];
        let b = [[0, 0], [0, 0]];
        let c = [0, 0];
        let d = [0]
        expect(await verifier.verifyProof(a, b, c, d)).to.be.false;
        //Smart contracts verify that the proof is false
    });
});


describe("Multiplier3 with Groth16", function () {

    beforeEach(async function () {
        Verifier = await ethers.getContractFactory("Multiplier3Verifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Circuit should multiply three numbers correctly", async function () {
        const circuit = await wasm_tester("contracts/circuits/Multiplier3.circom");

        const INPUT = {
            "in1": 2,
            "in2": 3,
            "in3":5
        }

        const witness = await circuit.calculateWitness(INPUT, true);

        //console.log(witness);

        assert(Fr.eq(Fr.e(witness[0]),Fr.e(1)));
        assert(Fr.eq(Fr.e(witness[1]),Fr.e(30)));
    });

    it("Should return true for correct proof", async function () {
         
        const { proof, publicSignals } = await groth16.fullProve({"in1":"2","in2":"3","in3":"5"}, "contracts/circuits/Multiplier3/Multiplier3_js/Multiplier3.wasm","contracts/circuits/Multiplier3/circuit_final.zkey")
        const calldata = await groth16.exportSolidityCallData(proof, publicSignals);
         
        const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());
        const a = [argv[0], argv[1]];

        const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
        const c = [argv[6], argv[7]];
        const Input = argv.slice(8);
    
        expect(await verifier.verifyProof(a, b, c, Input)).to.be.true;
         
    });

    it("Should return false for invalid proof", async function () {
        let a = [0, 0];
        let b = [[0, 0], [0, 0]];
        let c = [0, 0];
        let d = [0]
        expect(await verifier.verifyProof(a, b, c, d)).to.be.false;
    });
});


describe("Multiplier3 with PLONK", function () {

    beforeEach(async function () {
        Verifier = await ethers.getContractFactory("PlonkVerifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Should return true for correct proof", async function () {
        const { proof, publicSignals } = await plonk.fullProve({"in1":"2","in2":"3","in3":"5"}, "contracts/circuits/Multiplier3_plonk/Multiplier3_js/Multiplier3.wasm","contracts/circuits/Multiplier3_plonk/circuit_final.zkey")
        
        const calldata = await plonk.exportSolidityCallData(proof, publicSignals);
        const argv = calldata.split(',')
        const a =argv[0];
        const b= argv[1].replace(/["[\]\s]/g, "")
        const b2=[BigInt(b).toString()]
         
    
        expect(await verifier.verifyProof(a, b2)).to.be.true;
    });
    
    it("Should return false for invalid proof", async function () {
        let a = "0x04923b00f4111f2648eaebabd15e87959d7f69a650db9b31e09abe88d57bf23b25d5abf50646286389321323f507b77048afa1ddc6192d7ae1fb629f552cfbeb00e2b5227880c9387232abe44fcc1129855644c7d25ab78d841071c71de8fe940eb1ff984ee16e66253f3bb70793db8fe397bdcc864ea958859b11a3a0f7be261ac739704bd302ffee3e58fce629e76797df32064509fb78ae35d3964c3147600566bb6cd77294cdcc7256c7034ca52946fde8a261eee0b702d7983a5c00dbe7216a8443c58ca213f874d3389442b89b6f918ed6956d9acba71bd9b2467a0aac2156933aab1144cb421ea78f142613072f0d0e52c6638d08481a5b5dfbb697b32efcf552733b2f1da4a0b2fe124cef5317e982db3b5cd114c9033d47ca9fbac00db7d847bac7c5772c580a928e40599d94dc00bc4c35a07868ffc9d4b58d0c3906279f8b9ac282b41299489643e06e838db4b0908465afddcd90d5e4052226f92309a04aed73cbdb01d69c66bdb19c7f70b83b08574708615dad36d825390e6021c2585fb402c2cfe705e39c807615db9bbda23bef75955808c40b918a2fe38726e0898225465f77cf2ee75cb428e5d29d4c384834702073edc0f04c434b561c03d5719106ff21167d1ad4c350f5a13948203dca8cc042e4886fbbbc4b72d3b925b7f90dd37130513cba14b265a51f854fbf945351b40b74b524465b85754358154e55073327ec1d80df92d780204fa0c7c6611b587d24d3cf651278e44760652eddc124e31de9815efe9b739f81a6454e5a8b9d2dac3b9448cb6da35c9b34c511dc5119e10a58584f934fd0df1d14745049f35c8938395efda5800e45216daa26344e9a9ec07bda9389ce10e6af3888648801bce73dd84020f52a384a086b7b2e3f5bc7d2b93553db78abb9360e5282e2865a4fb38171d5ed775777343dee2b294f34547c65832c55a3781627412d8a79adc9c235f69c567ce49090d41f897522d13293c674663b0e13f6ee129e843e72faead1840c947b266596c1bbbb36b52597bb55a4f497cb505c3bafcd4c381e4d0a0691ea5d4d133958fe23d30319950e0c571541c61bbeef0c93c900aa0c9127caf3f314d379a5eeda0fd21e1a43e0";
        let b = [0]
        expect(await verifier.verifyProof(a, b, )).to.be.false;
    });
});