//将Uint8Array类型编译成字符串
export default function encodeUTF8(arr: Uint8Array) {
    const s: string[] = [];
    for (let i = 0; i < arr.length; i++) s.push(String.fromCharCode(arr[i]));
    return decodeURIComponent(s.join(''));
}