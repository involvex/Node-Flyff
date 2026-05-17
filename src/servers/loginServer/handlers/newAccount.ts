import _ from "lodash";

import { PacketType } from "../../../common/packetType";
import { FlyffPacket } from "../../../libraries/flyffPacket";
import { PacketHandler } from "../../../libraries/packetHandler";
import { SetPacketType } from "../../../decorators/packetHandler";
import { ErrorType } from "../../../common/errorType";
import Account from "../../../database/account";
import { AuthorityType } from "../../../common/authorityType";

@SetPacketType(PacketType.NEW_ACCOUNT)
export default class Handler extends PacketHandler {
  msgVersion: string;
  username: string;
  password: string;
  email: string;

  constructor (packet: FlyffPacket) {
    super();
    this.msgVersion = packet.readString();
    this.username = packet.readString();
    this.password = packet.readString();
    this.email = packet.readString();
  }

  async execute (): Promise<void> {
    try {
      // Validate the message version
      if (
        this.server?.instance?.config?.login_server.security[
          "build-version"
        ] !== this.msgVersion
      ) {
        return this.userConnection.sendError(ErrorType.ILLEGAL_VER);
      }

      const accounts = this.server?.instance?.getEntity("Account");

      // Check if account already exists
      const existingAccount = await accounts?.findOne({
        where: {
          username: this.username
        }
      });

      if (existingAccount) {
        return this.userConnection.sendError(ErrorType.ACCOUNT_EXISTS);
      }

      // Create new account
      const account = new Account();
      account.username = this.username;
      account.password = this.password;
      account.email = this.email;
      account.authority = AuthorityType.Player;
      account.verified = this.server?.instance?.config?.login_server.settings[
        "account-verification"
      ]
        ? false
        : true;
      account.banned = false;
      account.deleted = false;
      account.lastActivity = 0;

      await account.save();

      // Send success response
      const responsePacket = new FlyffPacket(PacketType.NEW_ACCOUNT);
      this.send(responsePacket);
    } catch (error) {
      this.logger.error(error);
      return this.userConnection.sendError(ErrorType.DEFAULT);
    }
  }
}
