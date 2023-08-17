//本程序由于重点在于测试交易，因此对于jwt的密钥保存采用这种非常随意的方式
//实际生产之中不应该将其以这种方式暴露在版本控制之中！应该采用设为服务器环境变量或采用专门的密钥管理软件来管理！

const jwtSecret = 'wo zui xi huan de ren shi lu wen jun';

export default jwtSecret;