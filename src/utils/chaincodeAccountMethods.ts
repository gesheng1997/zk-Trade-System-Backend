import { TextDecoder } from 'util';
import envConfig from '../config/envConfig';
import { Contract, ProposalOptions } from '@hyperledger/fabric-gateway';
import userType from '../constant/userType';
import { getConnection, closeConnection } from './grpcConnection'
import { STR_NONE, BALANCE_UNCHANGE, STILL_ALIVE } from '../constant/chaincodeConst';

const utf8Decoder = new TextDecoder();

//初始化世界状态的方法，将会在状态数组中创建一个初始的测试账户
export const initLedger = async (): Promise<void>  => {
    const { client, gateway, contract } = await getConnection();

    console.log('\n--> Submit Transaction: InitLedger, initialize test account in world state array\n');

    await contract.submit('InitLedger');

    console.log('*** Transaction committed successfully');

    closeConnection(client,gateway);
}

//创建一个新普通账户
export const createAccount = async (id: number, type:userType, publicKey:string): Promise<void> => {
    const { client, gateway, contract } = await getConnection();

    console.log('\n--> Submit Transaction: CreateAsset, creates new normal account with id, publicKey and type');

    if(type === userType.NORMAL){
        await contract.submit(
            'CreateAccount',
            {
                'arguments':[`${id}`,publicKey,`${userType.NORMAL}`, ''],
            }
        );
    }
    if(type === userType.ADMIN){
        await contract.submit(
            'CreateAccount',
            {
                'arguments':[`${id}`,publicKey,`${userType.ADMIN}`, ''],
            }
        );
    }

    console.log('*** Create Normal Account successfully');

    closeConnection(client,gateway);
}

//创建一个新企业账户
export const createOrgAccount = async (id: number, publicKey:string, pemCert:string): Promise<void> => {
    const { client, gateway, contract } = await getConnection();

    console.log('\n--> Submit Transaction: CreateAsset, creates new normal account with id, publicKey and type');

    await contract.submit(
        'CreateAccount',
        {
            'arguments':[`${id}`,publicKey,`${userType.ORGANIZATION}`, pemCert],
        }
    );

    console.log('*** Create Org Account Successfully');

    closeConnection(client,gateway);
}

//创建一个新管理员账户
// export const createAdminAccount = async (id: number, publicKey:string): Promise<void> => {
//     const { client, gateway, contract } = await getConnection();

//     console.log('\n--> Submit Transaction: CreateAsset, creates new normal account with id, publicKey and type');

//     await contract.submit(
//         'CreateAccount',
//         {
//             'arguments':[`${id}`,publicKey,`${userType.ADMIN}`,''],
//         }
//     );

//     console.log('*** Create Admin Account Successfully');

//     closeConnection(client,gateway);
// }

//读取指定id账户的数据，返回Json字符串
export const readAccount = async (id: number): Promise<string> => {
    const { client, gateway, contract } = await getConnection();

    console.log('\n--> Submit Transaction: CreateAsset, creates new normal account with id, publicKey and type');

    const resultBytes = await contract.evaluate(
        'ReadAccount',
        {
            'arguments':[`${id}`],
        }
    );
    const resultJson = utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);
    console.log('*** Result:', result);

    console.log('*** Query Account Successfully');

    closeConnection(client,gateway);
    return resultJson;
}

//读取指定id账户的数据，返回Json字符串
export const updateAccountBalance = async (id: number,balanceChange:number): Promise<void> => {
    const { client, gateway, contract } = await getConnection();

    console.log('\n--> Submit Transaction: CreateAsset, creates new normal account with id, publicKey and type');

    await contract.submit(
        'UpdateAccount',
        {
            'arguments':[`${id}`,`${balanceChange}`,STR_NONE, STILL_ALIVE, STR_NONE],
        }
    );

    console.log('*** Transaction committed successfully');

    closeConnection(client,gateway);
}

//批量update的方法，主要用于批量验证交易之后的更新，这个方法集成了批量验证链码的调用和循环以更新批量交易结果
// export const updateBatchAccountBalance = () => { return ''}

//更新账号公私钥对的方法
export const updateAccountPublicKey = async (id: number,publicKeyChange:string): Promise<void> => {
    const { client, gateway, contract } = await getConnection();

    console.log('\n--> Submit Transaction: CreateAsset, creates new normal account with id, publicKey and type');

    await contract.submit(
        'UpdateAccount',
        {
            'arguments':[`${id}`, BALANCE_UNCHANGE, publicKeyChange, STILL_ALIVE, STR_NONE],
        }
    );

    console.log('*** Transaction committed successfully');

    closeConnection(client,gateway);
}

export const verifyBatchTransaction = async (zkProofStr:string): Promise<string> => {
    const { client, gateway, contract } = await getConnection();

    const result = await contract.submit(
        'UpdateAccount',
        {
            'arguments':[ zkProofStr ],
        }
    );

    console.log('*** Transaction committed successfully');

    closeConnection(client,gateway);

    return result.toString();
}

//企业更新pem证书
export const updateAccountPemCert = async (id: number,pemCertChange:string): Promise<void> => {
    const { client, gateway, contract } = await getConnection();

    console.log('\n--> Submit Transaction: CreateAsset, creates new normal account with id, publicKey and type');

    await contract.submit(
        'UpdateAccount',
        {
            'arguments':[`${id}`, BALANCE_UNCHANGE, STR_NONE, STILL_ALIVE, pemCertChange],
        }
    );

    console.log('*** Transaction committed successfully');

    closeConnection(client,gateway);
}

//注销账号
export const deleteAccount = async (id: number): Promise<void> => {
    const { client, gateway, contract } = await getConnection();

    console.log('\n--> Submit Transaction: CreateAsset, creates new normal account with id, publicKey and type');

    await contract.submit(
        'DeleteAccount',
        {
            'arguments':[`${id}`],
        }
    );

    console.log('*** Transaction committed successfully');

    closeConnection(client,gateway);
}

//判断账号是否存在
export const accountExists = async (id: number): Promise<string> => {
    const { client, gateway, contract } = await getConnection();

    console.log('\n--> Submit Transaction: CreateAsset, creates new normal account with id, publicKey and type');

    const resultBytes = await contract.evaluate(
        'AccountExists',
        {
            'arguments':[`${id}`],
        }
    );

    const resultJson = utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);
    console.log('*** Result:', result);

    closeConnection(client,gateway);
    return resultJson;
}

//获取所有账户的信息
export const readAllAccounts = async ():Promise<string> => {
    const { client, gateway, contract } = await getConnection();

    console.log('\n--> Submit Transaction: CreateAsset, creates new normal account with id, publicKey and type');

    const resultBytes = await contract.evaluate('ReadAllAccounts');

    const resultJson = utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);
    console.log('*** Result:', result);

    closeConnection(client,gateway);
    return resultJson;
}