//全局响应拦截器，将所有正确响应按照固定格式包装返回前端
import { CallHandler, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, map } from 'rxjs';

interface Data<T>{
    data:T;
}

@Injectable()
export class Response<T> implements NestInterceptor{
    intercept(context,next:CallHandler):Observable<Data<T>>{
        return next.handle().pipe(map(data => ({
            data,
            status:0,
            message:"hahaha!",
            success:true
        })))
    }
}