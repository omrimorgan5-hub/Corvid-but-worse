require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ]
});

client.once('ready', () => {
  console.log(`✓ Bot logged in as ${client.user.tag}`);
});

const PREFIX = '!';

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'ban') {
    if (!message.member.permissions.has('BanMembers')) {
      return message.reply('You do not have permission to ban members.');
    }

    const user = message.mentions.users.first();
    if (!user) {
      return message.reply('Please mention a user to ban.');
    }

    const member = await message.guild.members.fetch(user.id).catch(() => null);
    if (!member) {
      return message.reply('User not found.');
    }

    try {
      await member.ban({ reason: `Banned by ${message.author.tag}` });
      message.reply(`${user.tag} has been banned.`);
    } catch (error) {
      console.error(error);
      message.reply('Failed to ban the user.');
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
