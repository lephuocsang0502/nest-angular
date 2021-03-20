import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { UserRole } from "./user.interface";

@Entity()
export class UserEntity{
    @PrimaryGeneratedColumn()
    id:number;

    @Column()
    name:string;

    //unique là duy nhất, không trùng nhau
    @Column({unique:true})

    username:string;

    @Column()
    email:string;

    @Column()
    password:string;

    @Column({type:'enum',enum:UserRole,default:UserRole.USER})
    role:UserRole; 

    @Column({nullable:true})
    profileImage:string;

    @BeforeInsert()
    emailToLowerCase(){
        this.email=this.email.toLowerCase();
    }
}