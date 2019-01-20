import { inject, injectable } from 'inversify'
import { Types, Config } from '../../common'
import { EventController as IEventController, GuildService, UserService } from '../interfaces'
import { Message, GuildMember, Guild, User } from 'discord.js'
import { CommandMessage } from 'discord.js-commando'

const config: Config = require('../../../config/config.json')

@injectable()
export class EventController implements IEventController {
  @inject(Types.UserService) public userService: UserService
  @inject(Types.GuildService) public guildService: GuildService

  public onMessage = async (message: Message) => {
    if (message.author.bot || message.channel.type !== 'text') {
      return
    }

    await this.createUserIfNotExists(message.author)
  }

  public onCommandRun = async (
    _command: CommandMessage,
    _promise: Promise<any>,
    message: CommandMessage
  ) => {
    if (config.bot.autoDeleteMessages.enabled && message.deletable) {
      await message.delete(config.bot.autoDeleteMessages.delay).catch(console.error)
    }
  }

  public onGuildCreate = async (guild: Guild) => {
    await this.guildService.createGuild(guild).catch(console.error)
    guild.members.forEach(member => this.userService.createUser(member.user))
  }

  public onGuildMemberAdd = async (member: GuildMember) => {
    await this.userService.createUser(member.user)
  }

  private createUserIfNotExists = async (author: User) => {
    const user = await this.userService.findById(author.id)

    if (!user) {
      await this.userService.createUser(author)
    }
  }
}
