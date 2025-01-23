// create a gist on GitHub.com using the provided code snippet
// use GitHub.com API to create a gist

import { Octokit } from '@octokit/rest';
import { response } from 'express';
import dotenv from "dotenv";

dotenv.config();

const token = process.env.GITHUB_TOKEN;

async function create_gist(filename, description, codesnippet) {

    try {
        const octokit = new Octokit({
            auth: token,
          })

        await octokit.request('POST /gists', {
          description: description,
          public: false,
          files:{ 
              [filename]: {
                  content: codesnippet
              }
          },
          headers: {
            'X-GitHub-Api-Version': '2022-11-28'
          }
        });
        // return success to inex.js if gist created successfully
        return response.status(200);
    } catch (error) {
        // return error status code to index.js if gist creation failed       
        console.error("Error creating gist:", error);
        return error.status || 500; // Return the error status code or 500 if not available
    }
}

export { create_gist };


