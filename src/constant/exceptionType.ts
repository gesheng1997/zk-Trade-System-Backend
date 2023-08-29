//该文件枚举定义了后端返回给前端的所有可能的错误状态

enum Exception{
    ALREADY_EXIST = 100,//账号已经存在
    INIT_FAIL,//链上世界状态初始化失败
    CREATE_FAIL,//链上账户创建失败
    VERIFY_FAIL,//ed25519签名验证失败
    INVALID_PEMCERT,//企业账户证书非法，要么是未加入联盟，要么是签名验证失败
    WRONG_TOKEN,//错误的管理员注册TOKEN，
    INVALID_LOGIN,//非法登陆，没有提供用户名、手机号、邮箱三者中任何一个
    DELETE_FAIL,//注销链上账户失败
    QUERY_FAIL,//查询链上所有账户信息失败
    NOT_ENOUGH_BALANCE,//用户余额不足
    WRONG_PASSWORD,//密码错误
    INVALID_TRANSACTION,//非法交易，要么时间戳不合法，要么交易金额小于0
    INVALID_ORGANIZAITON,//非法的金融组织，所给id对应组织未在系统中注册，不存在
    INVALID_UPDATE,//非法的更新尝试，用户尝试更新别的用户的个人信息
    INVALID_DELETE,//非法的注销账户尝试，用户尝试注销别的用户的账号
    WRONG_IDENTITY,//发起交易的fromid和token中的userId不相符
    UPDATE_BALANCES_FAIL,//批量更新数据库账户余额失败
    UPDATE_TRANSACTION_STATE_FAIL,//更新批量交易状态失败
    PERMISSION_DENIED,//所有管理员才能做的权限不足操作
    GENERATE_VOUCHERS_FAIL,//服务器批量签名凭证失败
}

export default Exception;