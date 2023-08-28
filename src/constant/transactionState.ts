//交易状态枚举类型
enum TransactionState {
    LAUNCHED = 0,//刚发出的交易为LAUNCHED状态
    QUEUEING,//处在二级队列中排队的交易为QUEUEING状态
    VERIFYING,//已经打包发往一级队列的交易为VERIFY状态
    VERIFIED,//验证成功为VERIFIED状态
    SETTLED,//确认无误交易关闭
    FAILED,//验证失败为FAILED状态
}

export default TransactionState;