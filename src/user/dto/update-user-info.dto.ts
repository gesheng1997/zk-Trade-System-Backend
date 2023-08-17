import { OmitType, PartialType } from '@nestjs/mapped-types';
import { UserInfoDto } from './user-info.dto';

//前端传入更新请求时，不需要提供UserInfo类之中的全部属性，作为更新操作的返回对象
export class UpdateUserInfoDto extends PartialType(
  OmitType(UserInfoDto, ['id', 'type', 'balance', 'access_token']),
) {
    alive:number;
}
