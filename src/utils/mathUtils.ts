/* eslint-disable @typescript-eslint/ban-types */

//将Uint8Array转换成二进制数组的函数
export function buffer2bits(buff) {
    const res:number[] = [];
    for (let i = 0; i < buff.length; i++) {
        for (let j = 0; j < 8; j++) {
            if ((buff[i] >> j) & 1) {
                res.push(1);
            } else {
                res.push(0);
            }
        }
    }
    return res;
}


function modulus(num, p) {
	return ((num % p) + p) % p;
}

//用于将大数字分解为指定大小的块的函数，主要是为了配合ed25519验签circom电路的输入
export function chunkBigInt(n, mod = BigInt(2 ** 51)):BigInt[] {
    if (!n) return [0n];
    if(n === 1n) return [1n,0n,0n];
    const arr:BigInt[] = [];
    while (n) {
        arr.push(BigInt(modulus(n, mod)));
        n /= mod;
    }
    return arr;
}