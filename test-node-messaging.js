
const crypto = require("crypto");

const {
    generateKeys,
    encryptMessage,
    decryptMessage
} = require("./encryption");

const NODE_URL = "http://localhost:3000";

async function postMessage(payload) {
    const response = await fetch(`${NODE_URL}/messages`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    return {
        status: response.status,
        data: await response.json()
    };
}

async function testMessaging() {
    const phoneA = generateKeys();
    const phoneB = generateKeys();

    const messageId = crypto.randomUUID();
    const originalMessage = "Hello from Phone A! Walkerline is working.";

    // Phone A encrypts the message for Phone B
    const encrypted = encryptMessage(
        originalMessage,
        phoneB.publicKey
    );

    const message = {
        messageId,
        sender: "Phone A",
        recipient: "Phone B",
        encrypted
    };

    console.log("1. Message encrypted.");

    // First submission
    const firstSend = await postMessage(message);

    if (firstSend.status !== 201 || firstSend.data.status !== "stored") {
        throw new Error("First message submission failed: " + JSON.stringify(firstSend));
    }

    console.log("2. Node stored the message.");

    // Retry the exact same message
    const retry = await postMessage(message);

    if (
        retry.status !== 200 ||
        retry.data.status !== "already_stored"
    ) {
        throw new Error("Duplicate retry was not handled correctly.");
    }

    console.log("3. Duplicate retry recognised. No second copy stored.");

    // Try reusing the ID with different encrypted content
    const differentEncrypted = encryptMessage(
        "This is a different message.",
        phoneB.publicKey
    );

    const conflict = await postMessage({
        ...message,
        encrypted: differentEncrypted
    });

    if (conflict.status !== 409) {
        throw new Error("Conflicting message ID was not rejected.");
    }

    console.log("4. Conflicting message ID rejected.");

    // Phone B retrieves its pending message
    const retrieval = await fetch(
        `${NODE_URL}/messages/Phone%20B`
    );

    if (!retrieval.ok) {
        throw new Error("Message retrieval failed.");
    }

    const messages = await retrieval.json();

    const received = messages.find(
        item => item.id === messageId
    );

    if (!received) {
        throw new Error("Message was not found in the pending queue.");
    }

    console.log("5. Phone B retrieved the message.");

    // Phone B decrypts the message
    const envelope = JSON.parse(received.content);

    const decrypted = decryptMessage(
        envelope,
        phoneB.privateKey
    );

    if (decrypted !== originalMessage) {
        throw new Error("Message decryption failed.");
    }

    console.log("6. Phone B decrypted the original message.");

    // Phone B acknowledges successful delivery
    const acknowledgement = await fetch(
        `${NODE_URL}/messages/${messageId}/ack`,
        { method: "POST" }
    );

    if (!acknowledgement.ok) {
        throw new Error("Message acknowledgement failed.");
    }

    console.log("7. Node acknowledged successful delivery.");

    // Verify the message is no longer pending
    const pendingResponse = await fetch(
        `${NODE_URL}/messages/Phone%20B`
    );

    const pendingMessages = await pendingResponse.json();

    const stillPending = pendingMessages.some(
        item => item.id === messageId
    );

    if (stillPending) {
        throw new Error("Acknowledged message remains pending.");
    }

    console.log("8. Message removed from pending queue.");
    console.log("DELIVERY AND DUPLICATE TEST: SUCCESS");
}

testMessaging().catch(error => {
    console.error("TEST FAILED:", error.message);
    process.exitCode = 1;
});
