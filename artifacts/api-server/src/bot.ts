import {
  Client,
  GatewayIntentBits,
  Events,
  PermissionFlagsBits,
  type Message,
  type GuildMember,
} from "discord.js";
import { logger } from "./lib/logger";

const PREFIX = "!";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.once(Events.ClientReady, (c) => {
  logger.info({ tag: c.user.tag }, "Discord bot ready");
});

function parseTarget(
  message: Message,
  args: string[],
): { targetId: string; remainingArgs: string[] } | null {
  const mentioned = message.mentions.users.first();
  if (mentioned) {
    return { targetId: mentioned.id, remainingArgs: args.slice(1) };
  }
  const rawId = args[0]?.replace(/\D/g, "");
  if (rawId) {
    return { targetId: rawId, remainingArgs: args.slice(1) };
  }
  return null;
}

function checkCallerPermission(
  message: Message,
  flag: bigint,
  label: string,
): boolean {
  if (!message.member?.permissions.has(flag)) {
    message.reply(`You don't have permission to ${label}.`).catch(() => null);
    return false;
  }
  return true;
}

function checkBotPermission(
  message: Message,
  flag: bigint,
  label: string,
): boolean {
  if (!message.guild?.members.me?.permissions.has(flag)) {
    message.reply(`I don't have permission to ${label}.`).catch(() => null);
    return false;
  }
  return true;
}

async function fetchMember(
  message: Message,
  targetId: string,
): Promise<GuildMember | null> {
  const member = await message.guild!.members.fetch(targetId).catch(() => null);
  if (!member) {
    await message.reply("Could not find that member in this server.");
  }
  return member;
}

client.on(Events.MessageCreate, async (message: Message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;
  if (!message.guild) {
    await message.reply("This command can only be used in a server.");
    return;
  }

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const command = args.shift()?.toLowerCase();

  // ── !ban @user [reason] ──────────────────────────────────────────────────
  if (command === "ban") {
    if (!checkCallerPermission(message, PermissionFlagsBits.BanMembers, "ban members")) return;
    if (!checkBotPermission(message, PermissionFlagsBits.BanMembers, "ban members")) return;

    const parsed = parseTarget(message, args);
    if (!parsed) {
      await message.reply("Usage: `!ban @user [reason]`");
      return;
    }

    const { targetId, remainingArgs } = parsed;
    const reason = remainingArgs.join(" ") || "No reason provided";
    const target = await fetchMember(message, targetId);
    if (!target) return;

    if (target.id === message.author.id) {
      await message.reply("You cannot ban yourself.");
      return;
    }
    if (!target.bannable) {
      await message.reply("I cannot ban this member — they may have a higher role than me.");
      return;
    }

    try {
      await target.ban({ reason: `${message.author.tag}: ${reason}` });
      await message.reply(`**${target.user.tag}** has been banned. Reason: ${reason}`);
      logger.info({ banned: target.user.tag, bannedBy: message.author.tag, reason, guild: message.guild.name }, "User banned");
    } catch (err) {
      logger.error({ err }, "Failed to ban user");
      await message.reply("Something went wrong while trying to ban that user.");
    }
    return;
  }

  // ── !unban <userID> [reason] ─────────────────────────────────────────────
  if (command === "unban") {
    if (!checkCallerPermission(message, PermissionFlagsBits.BanMembers, "unban members")) return;
    if (!checkBotPermission(message, PermissionFlagsBits.BanMembers, "unban members")) return;

    const rawId = args[0]?.replace(/\D/g, "");
    if (!rawId) {
      await message.reply("Usage: `!unban <userID> [reason]`");
      return;
    }

    const reason = args.slice(1).join(" ") || "No reason provided";

    try {
      const user = await client.users.fetch(rawId).catch(() => null);
      if (!user) {
        await message.reply("Could not find a user with that ID.");
        return;
      }
      await message.guild.bans.remove(rawId, `${message.author.tag}: ${reason}`);
      await message.reply(`**${user.tag}** has been unbanned. Reason: ${reason}`);
      logger.info({ unbanned: user.tag, unbannedBy: message.author.tag, reason, guild: message.guild.name }, "User unbanned");
    } catch (err) {
      logger.error({ err }, "Failed to unban user");
      await message.reply("That user doesn't appear to be banned, or something went wrong.");
    }
    return;
  }

  // ── !kick @user [reason] ─────────────────────────────────────────────────
  if (command === "kick") {
    if (!checkCallerPermission(message, PermissionFlagsBits.KickMembers, "kick members")) return;
    if (!checkBotPermission(message, PermissionFlagsBits.KickMembers, "kick members")) return;

    const parsed = parseTarget(message, args);
    if (!parsed) {
      await message.reply("Usage: `!kick @user [reason]`");
      return;
    }

    const { targetId, remainingArgs } = parsed;
    const reason = remainingArgs.join(" ") || "No reason provided";
    const target = await fetchMember(message, targetId);
    if (!target) return;

    if (target.id === message.author.id) {
      await message.reply("You cannot kick yourself.");
      return;
    }
    if (!target.kickable) {
      await message.reply("I cannot kick this member — they may have a higher role than me.");
      return;
    }

    try {
      await target.kick(`${message.author.tag}: ${reason}`);
      await message.reply(`**${target.user.tag}** has been kicked. Reason: ${reason}`);
      logger.info({ kicked: target.user.tag, kickedBy: message.author.tag, reason, guild: message.guild.name }, "User kicked");
    } catch (err) {
      logger.error({ err }, "Failed to kick user");
      await message.reply("Something went wrong while trying to kick that user.");
    }
    return;
  }

  // ── !mute @user <minutes> [reason] ───────────────────────────────────────
  if (command === "mute") {
    if (!checkCallerPermission(message, PermissionFlagsBits.ModerateMembers, "mute members")) return;
    if (!checkBotPermission(message, PermissionFlagsBits.ModerateMembers, "mute members")) return;

    const parsed = parseTarget(message, args);
    if (!parsed) {
      await message.reply("Usage: `!mute @user <minutes> [reason]`");
      return;
    }

    const { targetId, remainingArgs } = parsed;
    const minutes = parseInt(remainingArgs[0] ?? "", 10);

    if (isNaN(minutes) || minutes < 1 || minutes > 40320) {
      await message.reply("Please provide a valid duration in minutes (1–40320, which is 28 days max).");
      return;
    }

    const reason = remainingArgs.slice(1).join(" ") || "No reason provided";
    const target = await fetchMember(message, targetId);
    if (!target) return;

    if (target.id === message.author.id) {
      await message.reply("You cannot mute yourself.");
      return;
    }
    if (!target.moderatable) {
      await message.reply("I cannot mute this member — they may have a higher role than me.");
      return;
    }

    try {
      await target.timeout(minutes * 60 * 1000, `${message.author.tag}: ${reason}`);
      await message.reply(`**${target.user.tag}** has been muted for **${minutes} minute(s)**. Reason: ${reason}`);
      logger.info({ muted: target.user.tag, mutedBy: message.author.tag, minutes, reason, guild: message.guild.name }, "User muted");
    } catch (err) {
      logger.error({ err }, "Failed to mute user");
      await message.reply("Something went wrong while trying to mute that user.");
    }
    return;
  }

  // ── !unmute @user ─────────────────────────────────────────────────────────
  if (command === "unmute") {
    if (!checkCallerPermission(message, PermissionFlagsBits.ModerateMembers, "unmute members")) return;
    if (!checkBotPermission(message, PermissionFlagsBits.ModerateMembers, "unmute members")) return;

    const parsed = parseTarget(message, args);
    if (!parsed) {
      await message.reply("Usage: `!unmute @user`");
      return;
    }

    const target = await fetchMember(message, parsed.targetId);
    if (!target) return;

    if (!target.isCommunicationDisabled()) {
      await message.reply(`**${target.user.tag}** is not currently muted.`);
      return;
    }

    try {
      await target.timeout(null);
      await message.reply(`**${target.user.tag}** has been unmuted.`);
      logger.info({ unmuted: target.user.tag, unmutedBy: message.author.tag, guild: message.guild.name }, "User unmuted");
    } catch (err) {
      logger.error({ err }, "Failed to unmute user");
      await message.reply("Something went wrong while trying to unmute that user.");
    }
    return;
  }
});

export function startBot(): void {
  const token = process.env["DISCORD_BOT_TOKEN"];
  if (!token) {
    logger.error("DISCORD_BOT_TOKEN is not set — bot will not start");
    return;
  }
  client.login(token).catch((err) => {
    logger.error({ err }, "Failed to log in to Discord");
  });
}
