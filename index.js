require('dotenv/config');
const { Client, IntentsBitField } = require('discord.js');
const { OpenAI } = require('openai');
const fs = require('fs');

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

// read prompt from file with error handling

client.on('guildMemberAdd', async (member) => {
    const channel = member.guild.channels.cache.get(process.env.GENERAL_CHANNEL_ID);
    if (!channel) return;

    const welcomeMessage = `Afternoon, ${member.user.username}. Welcome to Diamondback! If you need help, talk to me in the Curiosity Shop. Now go! Go, go, go, go, go, go! Hopeless case!`;
    channel.send(welcomeMessage);
    console.log(`Sent welcome message to ${member.user.username}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.channel.id == process.env.PRIVATE_CHANNEL_ID) {
        
        return;
    }
    if (message.channel.id == process.env.CURIOSITYSHOP_CHANNEL_ID) {
        console.log(`Received message: ${message.content}`);

        if (message.content.startsWith('!')) {
            if (message.content.startsWith('!draw')) {
                console.log("Received draw command.");

                let imagePrompt;
                try {
                    imagePrompt = fs.readFileSync('image-prompt.txt', 'utf8');
                    console.log("Image Prompt loaded successfully.");
                } catch (error) {
                    console.error("Error reading image prompt file:", error);
                    process.exit(1); // Exit if the prompt file cannot be read
                }

                // Get user message
                const prompt = message.content.slice(6).trim();
                if (!prompt) {
                    message.reply("I cannot draw if you don't tell me what to draw! Brain like a quesadilla ...");
                    return;
                }

                console.log(`Asked to draw: ${prompt}`);

                let conversationLog = [{ 
                    role: 'system', 
                    content: imagePrompt
                }];
        
                conversationLog.push({
                    role: 'user',
                    content: message.content
                });
        
                await message.channel.sendTyping();
        
                let dallePrompt = "";
                try {
                    const completion = await openai.chat.completions.create({
                        model: 'gpt-3.5-turbo',
                        messages: conversationLog
                    });
        
                    dallePrompt = completion.choices[0].message.content;
                } catch (error) {
                    console.error("Error with OpenAI API call:", error);
                    if (error.response && error.response.status === 402) {
                        message.reply("If you want more answers, talk to <@339445862512197635>. Cheap bastard ... he should buy more credits from ChatGPT. Hopeless case!");
                        console.log("Ran out of OpenAI credits.");
                    } else {
                        message.reply("Oh no! Problems! Talk to <@339445862512197635>, that lazy bastard. Have him look at the logs. Now go!");
                    }
                    return;
                }

                await message.channel.sendTyping();
                
                try {
                    console.log(`Prompt length: ${dallePrompt.length}`);
                    dallePrompt = dallePrompt + "19th-century ink illustration with detailed crosshatching and line work, resembling antique prints. The image features precise lines, a weathered look, and is rendered in black ink on beige or sepia-toned paper.";
                    dallePrompt = dallePrompt.replace(/\n/g, " ");
                    dallePrompt = dallePrompt.substring(0,1000);
                    dallePrompt.trim().replace(/\s+/g, " ");

                    console.log(`Final prompt: ${dallePrompt}`);
                    const response = await openai.images.generate({
                        prompt: dallePrompt,
                        model: "dall-e-3",
                        n: 1,
                        size: "1024x1024"
                    });
        
                    const imageUrl = response.data[0].url;
                    message.reply(`Help will ask wife to draw. She not been outside for very long time though: ${imageUrl}`);
                    console.log(`Generated image for prompt: ${prompt}`);
                } catch (error) {
                    console.error("Error with OpenAI API call:", error);
                    message.reply("Sorry, I couldn't generate the image.");
                }
            }
            return;
        } else {

            let prompt;
            try {
                prompt = fs.readFileSync('prompt.txt', 'utf8');
                console.log("Prompt loaded successfully.");
            } catch (error) {
                console.error("Error reading prompt file:", error);
                process.exit(1); // Exit if the prompt file cannot be read
            }

            let conversationLog = [{ 
                role: 'system', 
                content: prompt
            }];

            conversationLog.push({
                role: 'user',
                content: message.content
            });

            await message.channel.sendTyping();

            try {
                const completion = await openai.chat.completions.create({
                    model: 'gpt-3.5-turbo',
                    messages: conversationLog
                });

                const reply = completion.choices[0].message.content;
                message.reply(reply);
                console.log(`Replied with: ${reply}`);
            } catch (error) {
                console.error("Error with OpenAI API call:", error);
                if (error.response && error.response.status === 402) {
                    message.reply("If you want more answers, talk to <@339445862512197635>. Cheap bastard ... he should buy more credits from ChatGPT. Hopeless case!");
                    console.log("Ran out of OpenAI credits.");
                } else {
                    message.reply("Sorry, I couldn't process your request.");
                }
            }
        }
    }
    if (message.channel.id == process.env.PRIVATE_CHANNEL_ID) {
        if (message.content.startsWith('!')) return;
        console.log("Received message in private channel.");
        const welcomeMessage = `Use this as your testing ground!`;
        message.channel.send(welcomeMessage);
    }
});

client.login(process.env.TOKEN).then(() => {
    console.log("Logged in successfully.");
}).catch(error => {
    console.error("Error logging in:", error);
});