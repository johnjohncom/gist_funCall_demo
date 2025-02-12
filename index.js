

import express from "express";
import bodyParser from 'body-parser';
import dotenv from "dotenv";
import { create_gist } from "./createGist.js";
import { createTextEvent } from "@copilot-extensions/preview-sdk";
import { prompt } from "@copilot-extensions/preview-sdk";


const app = express();
dotenv.config();

const port = process.env.PORT || 8080; // 환경 변수 PORT를 사용하고, 기본값으로 3000을 사용

// Middleware to capture raw request body
app.use(express.json({ limit: '50mb' }));

// const GITHUB_KEYS_URI = process.env.GITHUB_KEYS_URI;

app.get('/', (req, res) => {
    res.send('Hello from Copilot Extension - Create Gist!');
});


app.post('/', async (req, res) => {
    console.log('Request received');

    // getting user token from the request
    const token = req.get("X-GitHub-Token");

    // get code context from client request body
    const requestBodyMsgLength = req.body.messages.length;
    console.log(requestBodyMsgLength);
    const copilot_references = req.body.messages[requestBodyMsgLength-1].copilot_references;
    console.log(copilot_references);

    const selectedCode = copilot_references[0].data.content;
    // console.log(selectedCode);
    const file_name = copilot_references[0].id;

    // Request to CAPI for function call and it's argument
    const { message } = await prompt("create a gist", {
        model: "gpt-4o",
        token: token,
        system: "Using the tool call, You are a helpful assistant who can create a Gist for the block of codes in the context from VS Code on behalf of the user.",
        messages: [
            { role: "user", content: "create a gist"},
            { role: "assistant", content: `As a Gist assistant, you need to make summary of the ${selectedCode} and put it into the 'description' argument for the function call`},
        ],

        // Function call
        tools: [
            {
                type: "function",
                function: {
                    name: "create_gist",
                    description: "Create a Gist on GitHub.com's user account based on the codesnippet, file name and description.",
                    parameters: {
                        type: "object",
                        properties: {
                            description: {
                                type: "string",
                                description: "The description for the Gist.",
                            },   
                        },
                        required: [ "description" ],
                        additionalProperties: false,
                    },
                },
            },
        ],
        tool_choice: "required", // "optional" or "required"
    });

    // Convert the message object to a JSON string
    const messageString = JSON.stringify(message);

    // Parse the accumulated data as JSON
    const jsonResponse = JSON.parse(messageString);

    // Tool call
    const tool_calls = jsonResponse.tool_calls;

    if (tool_calls) {
        const functionCall = tool_calls[0];
        const functionName = functionCall.function.name;

        const args = functionCall.function.arguments;
        const argsObj = JSON.parse(args);

        if (functionName === "create_gist") {
            try {
                // Call the createGist function with arguments
                const status = await create_gist(file_name, argsObj.description, selectedCode);
                if (status.statusCode === 200) {
                    res.write(createTextEvent("Gist created successfully!"));
                } else {
                    res.write(createTextEvent("Failed to create Gist:" + status.statusCode));
                }
            } catch (error) {
                console.error("Error creating gist:", error);
                res.write(createTextEvent("Failed to create Gist:" + error));
            }
            

        } else {
            res.write(createTextEvent("Invalid function name"));
        }
    }
    // End the response
    res.end();
    
    // } else {
    //     // If the request is not verified, send an error response
    //     res.status(401).send('Unauthorized');
    // }
    
});

// server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});