type approvedCount = 2 | 4 | 8 | 16 | 32;

const batchCount = {
    //批量交易笔数的默认值,最低4笔每批
    _batchCount :8,

    //通过get set操作批量交易笔数
    get count(){
        return this._batchCount;
    },

    set count(value : approvedCount){
        if(value === 2) this._batchCount *= 2;
        else{
            this._batchCount = value;
        }
    }
}

export default batchCount;