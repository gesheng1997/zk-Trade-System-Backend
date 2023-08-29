//这是一个模仿circomlib编写的累加电路，没有考虑越界情况
//因为在我的电路中，累加只考虑简单的掩码运算相加，越界可能很小
pragma circom  2.0.0;

template MultiAdd(amount){
    signal input in[amount];
    signal output out;
    component add1;
    component add2;
    component adds[2];
    if (amount==1) {
        out <== in[0];
    } else if (amount==2) {
        add1 = Add();
        add1.a <== in[0];
        add1.b <== in[1];
        out <== add1.out;
    } else {
        add2 = Add();
        var amount1 = amount\2;
        var amount2 = amount-amount\2;
        adds[0] = MultiAdd(amount1);
        adds[1] = MultiAdd(amount2);
        var i;
        for (i=0; i<amount1; i++) adds[0].in[i] <== in[i];
        for (i=0; i<amount2; i++) adds[1].in[i] <== in[amount1+i];
        add2.a <== adds[0].out;
        add2.b <== adds[1].out;
        out <== add2.out;
    }
}

template Add(){
    signal input a;
    signal input b;
    signal output out;

    out <== a + b;
}