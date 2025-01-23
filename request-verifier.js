import crypto from 'crypto';
import {ChatResponseMessage} from './messages.js';

async function verifyAgentRequest(payload, request, GITHUB_KEYS_URI) {
    const signature = request.headers["github-public-key-signature"];
    const keyID = request.headers["github-public-key-identifier"];

    const keys = await fetch(GITHUB_KEYS_URI, {
        method: "GET",
    }).then((res) => res.json());

    console.log("Public key verification");
    const publicKey = keys.public_keys.find((k) => k.key_identifier === keyID);
    if (!publicKey) {
        return { "status": false, "message": ChatResponseMessage.NO_PUBLIC_KEY };
    }

    console.log("Signature verification");
    const verify = crypto.createVerify("SHA256").update(payload);
    if (!verify.verify(publicKey.key, Buffer.from(signature, "base64"), "base64")) {
        //  console.error("Error: Signature does not match payload");
        return { "status": false, "message": "Error: Signature does not match payload" };
    } else {
        // console.log("Signature verified");
        return { "status": true, "message": "Signature verified" };
    }
}

export { verifyAgentRequest };