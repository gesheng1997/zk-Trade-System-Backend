//二级队列，集群中每一个客户端后端都有一个二级队列

export default () => ({
    host: parseInt(process.env.QUEUE2_HOST,10) || 'localhost',
    port: parseInt(process.env.QUEUE2_PORT,10) || 6379,
})