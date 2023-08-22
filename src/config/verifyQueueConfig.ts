/* 
    生产环境中指向一个远程地址，即fabric运行的地址上运行的一个后端，这个后端上只运行这个一级队列，
    用于接收打包交易的数据并交由和其处于同一台机器上运行的fabric验证验证通过后发布事件
    此处由于是测试环境，我们一级二级队列都放在客户端后端'localhost'上面！
*/

export default () => ({
    host: parseInt(process.env.QUEUE1_HOST,10) || 'localhost',
    port: parseInt(process.env.QUEUE1_PORT,10) || 6379,
})