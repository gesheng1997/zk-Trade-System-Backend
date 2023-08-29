//验证状态转移的合法性
pragma circom  2.0.0;

include "./transaction.circom";
include "./circomlib/comparators.circom";
include "./circomlib/gates.circom";

template BatchTrans(m){
    signal input user_ids[m*2];//交易涉及的用户id,由于一批交易为m笔打包，因此一批交易最多涉及m*2个用户
    signal input init_state[m*2];//涉及的用户的初始账户余额状态
    signal input final_state[m*2];//涉及的用户批量交易后的状态
    signal input transactions[m][2][3];//代表批量交易的数组

    signal median_state[m][m*2];//median_state二维数组记录每笔交易过后中间余额状态，
    signal compare_result[m*2];

    signal output out;
    
    component transaction_verify[m];//单笔交易状态转移的template
    component check_equal[2*m];//判断计算的最终状态和final_state中每个余额是否相等
    component and_res = MultiAND(2*m);

    //对每笔交易做状态转移
    for(var i = 0;i < m;i++){

        transaction_verify[i] = Transaction(2*m);
        //输入用户id信息数组和目前状态数组
        for(var j = 0;j < 2*m;j++){
            transaction_verify[i].user_ids[j] <== user_ids[j];

            if(i == 0){
                transaction_verify[i].temp_state[j] <== init_state[j];
            }
            else{
                transaction_verify[i].temp_state[j] <== median_state[i - 1][j];
            }
        }

        //输入当前交易信息
        for(var j = 0;j < 2;j++){
            for(var k = 0;k < 3;k++){
                transaction_verify[i].transaction[j][k] <== transactions[i][j][k];
            }
        }

        //每笔交易的结果存入中间状态数组
        for(var j = 0;j < 2*m;j++){
            median_state[i][j] <== transaction_verify[i].out[j];
        }
    }

    //所有交易的转移结束，验证最终状态和final_state中声明的最终状态是否相等以验证转移合法性
    for(var i = 0;i < 2*m;i++){
        check_equal[i] = IsEqual();
        check_equal[i].in[0] <== median_state[m - 1][i];
        check_equal[i].in[1] <== final_state[i];

        compare_result[i] <== check_equal[i].out;
    }

    for(var i = 0;i < 2*m;i++){
        and_res.in[i] <== compare_result[i];
    }

    out <== and_res.out;
}

component main {public [init_state,final_state]} = BatchTrans(8);