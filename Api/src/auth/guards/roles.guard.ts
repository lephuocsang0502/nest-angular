import { Injectable, CanActivate, ExecutionContext, Inject, forwardRef } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from 'src/user/models/user.interface';
import { UserService } from 'src/user/service/user.service';
import { hasRoles } from '../decorator/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {

  constructor(
    private reflector: Reflector,
    @Inject(forwardRef(() => UserService))
    private userService: UserService
  ) { }

  canActivate(
    context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user: User = request.user.user;
    return this.userService.findOne(user.id).pipe(
      map((user: User) => {
        const hashRole = () => roles.indexOf(user.role) > -1;
        let hasPermission: boolean = false;
        if (hasRoles()) {
          hasPermission = true
        };
        return user && hasPermission;
      })
    )
  }
}
