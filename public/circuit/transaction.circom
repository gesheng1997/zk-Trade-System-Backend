pragma circom  2.0.0;

include "./circomlib/comparators.circom";
include "./select_array_element.circom";

template Transaction(amount){
    signal input user_ids[amount];
    signal input temp_state[amount];
    signal input transaction[2][3];

    signal output out[amount];//单笔交易转移后的状态

    //user_ids数组中交易双方的id值
    signal sender_id;
    signal receiver_id;

    //由索引掩码数组生成的发方和收方的状态变化数组，只有对应索引处有值
    signal sender_change[amount];
    signal receiver_change[amount];

    // component check_id = IsEqual();
    //该实例用于获取本笔交易矩阵中记录的sender和receiver的索引位置在user_ids中记录的id值
    //并紧接着和交易矩阵中的记录的双方id值比较
    component find_id[2];
    component get_mask[2];

    //获取交易中sender的id
    find_id[0] = SelectElement(amount);
    find_id[0].target_idx <== transaction[0][1];
    for(var i = 0;i < amount;i++){
        find_id[0].array[i] <== user_ids[i];
    }
    sender_id <== find_id[0].out;

    //获取交易中receiver的id
    find_id[1] = SelectElement(amount);
    find_id[1].target_idx <== transaction[1][1];
    for(var i = 0;i < amount;i++){
        find_id[1].array[i] <== user_ids[i];
    }
    receiver_id <== find_id[1].out;

    //判等约束
    sender_id === transaction[0][0];
    receiver_id === transaction[1][0];

    //生成发方的sender_change数组
    get_mask[0] = MaskIdx(amount);
    get_mask[0].target_idx <== transaction[0][1];
    for(var i = 0;i < amount;i++){
        sender_change[i] <== get_mask[0].out[i] * transaction[0][2];
    }
    //生成收方的reciever_change数组
    get_mask[1] = MaskIdx(amount);
    get_mask[1].target_idx <== transaction[1][1];
    for(var i = 0;i < amount;i++){
        receiver_change[i] <== get_mask[1].out[i] * transaction[1][2];
    }
    //合并上述二者并生成最终状态
    for(var i = 0;i < amount;i++){
        out[i] <== temp_state[i] + sender_change[i] + receiver_change[i];
    }
}