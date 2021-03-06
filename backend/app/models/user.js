import moment from "moment"
import bcrypt from "bcrypt-nodejs"
import buildVk from 'config/vk'
import Sequelize from 'db/sequelize'
import DataType, { Op } from "sequelize"
import VkPerson from "./vkPerson"

const schema = Sequelize.define('users', {

  name: DataType.STRING,
  email: DataType.STRING,
  password: DataType.STRING,

  vk_token: DataType.STRING,
  vk_active: DataType.BOOLEAN,

}, {

})

schema.hook('beforeSave', async function(user, options) {
  if (user.changed('password')) user.password = await bcrypt.hashSync(user.password)
})

schema.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compareSync(candidatePassword, this.password)
}

schema.prototype.vkApi = async function() {
  return buildVk(this.vk_token)
}

schema.prototype.isFriendNeed = async function() {
  const countFriend = await this.countTodayFriend()
  return 25 >= countFriend
}

schema.prototype.hasDesiredFriends = async function() {
  const person = await VkPerson.findOne({
    where: {
      isFriend: false,
      deactivated: false,
      user_id: this.id,
    }
  })

  return person != null || person != undefined
}

schema.prototype.countTodayFriend = async function() {
  let res = await this.getVkPersons({
    where: {
      addFriendAt: {
        [Op.gt]: moment().add(-1, 'days').toDate(),
        [Op.lt]: moment().add(1, 'days').toDate(),
      }
    }
  })

  return res.length
}

export default schema
