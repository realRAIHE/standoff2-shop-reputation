
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const FILE = "./reputation.json";

let reputation = {};

if (fs.existsSync(FILE)) {
  reputation = JSON.parse(fs.readFileSync(FILE, "utf8"));
}

function save() {
  fs.writeFileSync(FILE, JSON.stringify(reputation, null, 2));
}

client.once("ready", () => {
  console.log(`Botas prisijungė: ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (!message.guild || message.author.bot) return;

  const args = message.content.trim().split(/\s+/);
  const command = args[0].toLowerCase();

  if (command === "+rep") {
    const target = message.mentions.users.first();

    if (!target) return message.reply("Naudojimas: +rep @user");
    if (target.id === message.author.id) return message.reply("Negali duoti reputacijos sau!");
    if (target.bot) return message.reply("Botams reputacijos duoti negalima.");

    const guild = message.guild.id;
    const giver = message.author.id;
    const receiver = target.id;

    reputation[guild] ??= {};

    const key = `${giver}_${receiver}`;
    reputation[guild][key] ??= false;

    if (reputation[guild][key]) {
      return message.reply("Šiam vartotojui reputaciją jau davei!");
    }

    reputation[guild][key] = true;

    const scoreKey = `score_${receiver}`;
    reputation[guild][scoreKey] = (reputation[guild][scoreKey] || 0) + 1;

    save();

    return message.reply(`⭐ ${target} gavo +1 reputaciją!`);
  }

  if (command === "!rep") {
    const target = message.mentions.users.first() || message.author;
    const guild = message.guild.id;
    const score = reputation[guild]?.[`score_${target.id}`] || 0;

    return message.reply(`⭐ **${target.username}** turi **${score} REP**.`);
  }

  if (command === "!top") {
    const guild = message.guild.id;
    const data = reputation[guild] || {};

    const users = Object.entries(data)
      .filter(([key]) => key.startsWith("score_"))
      .map(([key, score]) => ({
        id: key.replace("score_", ""),
        score
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    const embed = new EmbedBuilder()
      .setTitle("🏆 Reputation Leaderboard")
      .setColor(0x8A2BE2)
      .setDescription(
        users.length
          ? users.map((u, i) => `**${i + 1}.** <@${u.id}> — ${u.score} REP`).join("\n")
          : "Kol kas reputacijos nėra."
      );

    return message.reply({ embeds: [embed] });
  }
});

client.login(process.env.DISCORD_TOKEN);
