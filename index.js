require('dotenv/config');
const { Client, IntentsBitField } = require('discord.js');
const { OpenAI } = require('openai');

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent
    ]
});

client.on('ready', () => {
    console.log("The bot is online!");
});

const openai = new OpenAI({
    apiKey: process.env.API_KEY,
});

// read prompt from file
const fs = require('fs');
const prompt = fs.readFileSync('prompt.txt', 'utf8');

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.content.startsWith('!')) return;
    if (message.channel.id == process.env.CHANNEL_ID) {
        let conversationLog = [{ 
            role: 'system', 
            content: prompt
        }];

        conversationLog.push({
            role: 'user',
            content: message.content
        });

        await message.channel.sendTyping();

        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: conversationLog
        });

        message.reply(completion.choices[0].message.content);
    }
});

client.login(process.env.TOKEN);
