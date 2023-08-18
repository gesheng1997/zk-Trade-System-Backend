import * as path from 'path';

const ORG_NAME = 'org1';
const cryptoPath = envOrDefault('CRYPTO_PATH', path.resolve('/home', 'zionlee', 'transaction-network', 'organizations', 'peerOrganizations', `${ORG_NAME}.example.com`));

const envConfig = {
    channelName : envOrDefault('CHANNEL_NAME', 'transactionchannel'),
    chaincodeName: envOrDefault('CHAINCODE_NAME', 'transactionbasic'),
    mspId: envOrDefault('MSP_ID', 'Org1MSP'),

    // Path to crypto materials.
    cryptoPath,

    // Path to user private key directory.
    keyDirectoryPath: envOrDefault('KEY_DIRECTORY_PATH', path.resolve(cryptoPath, 'users', `User1@${ORG_NAME}.example.com`, 'msp', 'keystore')),

    // Path to user certificate.
    certPath: envOrDefault('CERT_PATH', path.resolve(cryptoPath, 'users', `User1@${ORG_NAME}.example.com`, 'msp', 'signcerts', 'cert.pem')),

    // Path to peer tls certificate.
    tlsCertPath: envOrDefault('TLS_CERT_PATH', path.resolve(cryptoPath, 'peers', `peer0.${ORG_NAME}.example.com`, 'tls', 'ca.crt')),

    // Gateway peer endpoint.
    peerEndpoint: envOrDefault('PEER_ENDPOINT', 'localhost:7051'),

    // Gateway peer SSL host name override.
    peerHostAlias: envOrDefault('PEER_HOST_ALIAS', `peer0.${ORG_NAME}.example.com`),
}

/**
 * envOrDefault() will return the value of an environment variable, or a default value if the variable is undefined.
 */
function envOrDefault(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
}

export default envConfig;