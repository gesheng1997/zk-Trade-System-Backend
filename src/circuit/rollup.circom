//考虑到验证签名版本的电路生成r1cs占用内存过大，8笔
pragma circom  2.0.0;

include "./batchtransaction.circom";

template Rollup(m) {//m:Rollup批量验证的交易笔数

    //这部分是关于交易的信号
    signal input user_ids[m*2];//交易涉及的用户id,由于一批交易为m笔打包，因此一批交易最多涉及m*2个用户
    signal input init_balance_state[m*2];//涉及的用户的初始账户余额状态
    signal input final_balance_state[m*2];//涉及的用户批量交易后的状态

    /*
        *** 代表批量交易的数组
        *** 这里有必要解释一下这个矩阵的含义，共m笔交易，每一笔交易都用一个3*3二维矩阵表示
        *** 第一行第二行分别表示交易收款方和付款方在交易过后账户余额的变化值
        *** 每列第一个元素表示用户id，第二个元素表示该用户id在user_ids和状态数组中的索引位置idx,第三个元素表示余额变化
        *** 第三列表示交易涉及的商品id，在good_ids中的索引位置idx，以及商品数量的变化
    */
    signal input transactions[m][2][3];

    signal transactions_out;//状态转移验证的结果

    signal output out;

    component state_verify = BatchTrans(m);

    //验证状态转移合法性

    //向批量验证电路输入信号
    for(var i = 0;i < m*2;i++){
        state_verify.user_ids[i] <== user_ids[i];
        state_verify.init_state[i] <== init_state[i];
        state_verify.final_state[i] <== final_state[i];

        if(i < m){
            
        }
    }

    for(var i = 0;i < m;i++){
        for(var j = 0;j < 2;j++){
            for(var k = 0;k < 3;k++){
                state_verify.transactions[i][j][k] <== transactions[i][j][k];
            }
        }
    }

    out <== state_verify.out;
}

component main {public [init_state,final_state]} = Rollup(512);