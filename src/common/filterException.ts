//全局异常拦截器，拦截所有http错误，并按照固定格式封装返回前端
import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";
import { Request, Response } from "express";

@Catch(HttpException)
export class HttpFilter implements ExceptionFilter{
    catch(exception:HttpException,host:ArgumentsHost){
        const context = host.switchToHttp();
        const request = context.getRequest<Request>();
        const response = context.getResponse<Response>();

        const status = exception.getStatus();
        response.status(status).json({
            status,
            data:exception,
            path:request.path,
            time:new Date(),
            success:false,
        })
    }
}