/*
    该电路用于获取指定索引位置处的元素！
    为什么要有这个电路，主要原因是有些索引值idx是通过信号的形式输入上层电路的
    而需要索引查找的数组array本身也是信号形式给进来的，circom并不允许这样子取值array[idx] 将会导致non quadratic类型错误！
    因此这个电路用于完成这件事儿
*/
pragma circom  2.0.0;

include "./circomlib/comparators.circom";
include "./multiadd.circom";

//生成索引掩码电路，只有目标索引处的值为1其余位置为0
template MaskIdx(amount){
    signal input target_idx;
    signal output out[amount];

    //由于要执行amount次判等，因此要实例化amount个判等电路，否则会报给同一个信号多次赋值错误
    //component equal_check = IsEqual()
    component equal_check[amount];

    //对于每个可能的索引值，检查目标值是否和其相等
    //如果相等，则输出数组中对应索引处记为1，否则为0
    for(var i = 0;i < amount;i++){
        equal_check[i] = IsEqual();
        equal_check[i].in[0] <== target_idx;
        equal_check[i].in[1] <== i;
        out[i] <== equal_check[i].out;
    }
}

template SelectElement(amount){
    signal input array[amount];
    signal input target_idx;
    signal output out;

    component get_mask = MaskIdx(amount);
    component mask_multi = MultiAdd(amount);

    get_mask.target_idx <== target_idx;

    //get_mask电路的输出数组作为一个掩码，和array中的对应位置元素逐一相乘并相加，最后得到的结果就是目标id
    for(var i = 0;i < amount;i++){
        mask_multi.in[i] <== get_mask.out[i] * array[i];
    }
    out <== mask_multi.out;
}