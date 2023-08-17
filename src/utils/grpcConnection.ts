import * as grpc from '@grpc/grpc-js';
import { connect, Contract, Gateway, Identity, Signer, signers, GrpcClient } from '@hyperledger/fabric-gateway';
import * as crypto from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import envConfig from '../config/envConfig';

//建立grpc连接，并返回访问链码所需的三个对象
export async function getConnection(){
    // The gRPC client connection should be shared by all Gateway connections to this endpoint.
    const client = await newGrpcConnection();

    const gateway = connect({
        client,
        identity: await newIdentity(),
        signer: await newSigner(),
        // Default timeouts for different gRPC calls
        evaluateOptions: () => {
            return { deadline: Date.now() + 5000 }; // 5 seconds
        },
        endorseOptions: () => {
            return { deadline: Date.now() + 15000 }; // 15 seconds
        },
        submitOptions: () => {
            return { deadline: Date.now() + 5000 }; // 5 seconds
        },
        commitStatusOptions: () => {
            return { deadline: Date.now() + 60000 }; // 1 minute
        },
    });
    console.log("*****************grpc connection successfully established.*****************");

    // 获取制定通道的通道实例，注意这里的通道名和下面方法中的链码名都可以在./config/envConfig中修改
    const network = gateway.getNetwork(envConfig.channelName);

    // 从通道实例中获取通道上安装的指定名字的链码
    const contract: Contract = network.getContract(envConfig.chaincodeName);

    //返回连接并访问链码的所有必须的要素
    return { client, gateway, contract };
}

//手动关闭grpc连接，将关闭grpc的两步合成一个函数
export function closeConnection(client:GrpcClient,gateway:Gateway){
    client.close();
    gateway.close();
    console.log("********************grpc connection successfully closed.********************");
}

async function newGrpcConnection(): Promise<grpc.Client> {
    const tlsRootCert = await fs.readFile(envConfig.tlsCertPath);
    const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
    return new grpc.Client(envConfig.peerEndpoint, tlsCredentials, {
        'grpc.ssl_target_name_override': envConfig.peerHostAlias,
    });
}

async function newIdentity(): Promise<Identity> {
    const credentials = await fs.readFile(envConfig.certPath);
    const mspId = envConfig.mspId;
    return { mspId, credentials };
}

async function newSigner(): Promise<Signer> {
    const files = await fs.readdir(envConfig.keyDirectoryPath);
    const keyPath = path.resolve(envConfig.keyDirectoryPath, files[0]);
    const privateKeyPem = await fs.readFile(keyPath);
    const privateKey = crypto.createPrivateKey(privateKeyPem);
    return signers.newPrivateKeySigner(privateKey);
}