
import { Body, Controller, Get, Param, Post,Put,Delete, Query, UseInterceptors, UploadedFile, UseGuards, Request, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express/multer/interceptors/file.interceptor';
import { Pagination } from 'nestjs-typeorm-paginate';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { User, UserRole } from '../models/user.interface';
import { UserService } from '../service/user.service';
import { diskStorage } from  'multer';
import path = require('path');
import { v4 as uuidv4 } from 'uuid';
import { hasRoles } from 'src/auth/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-guards';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { join } from 'path';
import { UserIsUserGuard } from 'src/auth/guards/UserIsUser.guard';

export const storage = {
    storage: diskStorage({
        destination: './uploads/profileImages', 
        filename: (req, file, cb) => {     
          const fileName :string = path.parse(file.originalname).name.replace(/\s/g,'')+ uuidv4();
          const extension:string = path.parse(file.originalname).ext;
          cb(null,`${fileName}${extension}`)
          }
      })         

}



@Controller('user')
export class UserController {
    constructor(private userService:UserService){}

    @Post()
   
    create(@Body()user:User):Observable<User|Object>{
        return this.userService.create(user).pipe(map((user:User)=>user),
        catchError(err=>of({error:err.message}))
        );
    }   

    @Post('login')
   
    login(@Body() user:User):Observable<Object>{
        return this.userService.login(user).pipe(
            map((jwt:string)=>{
                return {access_token: jwt};
            })
        )
    }
    @Get(':id')
    findOne(@Param()param):Observable<User>{
        return this.userService.findOne(param.id);
    }

    @hasRoles(UserRole.ADMIN)
    @UseGuards(JwtAuthGuard,RolesGuard)
    @Get()
   
    index( 
        @Query('page') page = 1, 
        @Query('limit') limit = 10,
        @Query('username') username:string
        ):Observable<Pagination<User>>{
        limit = limit > 100 ? 100 : limit;

        if(username===null|| username==undefined){
            return this.userService.paginate({page, limit, route: 'http://localhost:3000/api/user'});
        }else{
            return this.userService.paginateFillterByUserName(
                {page, limit, route: 'http://localhost:3000/api/user'},
                {username}
                );
        }
        
    }
    @Delete(':id')
    deleteOne(@Param('id') id:string):Observable<any>{
        return this.userService.deleteOne(Number(id));
    }

    @UseGuards(JwtAuthGuard,UserIsUserGuard)
    @Put(':id')
    updateOne(@Param('id') id:string ,@Body() user:User):Observable<any>{
        return this.userService.updateOne(Number(id),user);
    }

    @Put(':id/role')
    updateRoleOfUser(@Param('id') id:string, @Body()user :User):Observable<User>{
        return this.userService.updateRoleOfUser(Number(id),user);
    }
 
    @UseGuards(JwtAuthGuard,RolesGuard)
    @Post('upload')
    @UseInterceptors(FileInterceptor('file', storage))
    uploadFile(@UploadedFile()file ,@Request() req): Observable<object>{

        const user: User=req.user.user;
        return this.userService.updateOne(user.id,{profileImage:file.filename}).pipe(
            tap((user:User)=>console.log(user)),
            map((user:User)=>({profileImage:user.profileImage}))
        )    
    }

    @Get('profile-image/:imagename')
    findProfileImage(@Param('imagename') imagename, @Res() res): Observable<Object> {
        return of(res.sendFile(join(process.cwd(), 'uploads/profileimages/' + imagename)));
    }
}
