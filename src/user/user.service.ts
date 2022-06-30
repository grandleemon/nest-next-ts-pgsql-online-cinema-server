import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from 'nestjs-typegoose'
import { UserModel } from './user.model'
import { ModelType } from '@typegoose/typegoose/lib/types'
import { UpdateUserDto } from './dto/update-user.dto'
import { genSalt, hash } from 'bcryptjs'

@Injectable()
export class UserService {

  constructor(@InjectModel(UserModel) private readonly userModel: ModelType<UserModel>) {
  }

  async byId(_id: string) {
    const user = await this.userModel.findById(_id)
    if (!user) throw new NotFoundException('User not found')
    return user
  }

  async updateProfile(_id: string, dto: UpdateUserDto) {
    const user = await this.byId(_id)
    const isSameUser = await this.userModel.findOne({ email: dto.email })

    if (isSameUser && String(_id) !== String(isSameUser._id)) {
      throw new NotFoundException('Email is taken by another user')
    }

    if (dto.password) {
      const salt = await genSalt(10)
      user.password = await hash(dto.password, salt)
    }

    user.email = dto.email
    console.log(dto.email)
    if (dto.isAdmin || dto.isAdmin === false) {
      user.isAdmin = dto.isAdmin
    }

    await user.save()

    return
  }

  async getCount() {
    return this.userModel.find().count().exec()
  }

  async getAllUsers(searchTerm?: string) {
    let options = {}

    if (searchTerm) {
      options = {
        $or: [
          {
            email: new RegExp(searchTerm, 'i'),
          },
        ],
      }
    }

    return this.userModel.find(options).select('-password -updatedAt -__v').sort({
      createdAt: 'desc',
    })
  }

  async deleteUser(id: string) {
    return this.userModel.findByIdAndDelete(id).exec()
  }
}
