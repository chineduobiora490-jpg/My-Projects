const http = require("http");
const Database = require("better-sqlite3");
const {
    generateKeys,
    encryptMessage,
    decryptMessage
} = require("./encryption");

const db = new Database("walkerline.db");

db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        sender TEXT NOT NULL,
        recipient TEXT NOT NULL,
        content TEXT NOT NULL,
        createdAt TEXT NOT NULL
    )
`);
const columns = db.prepare("PRAGMA table_info(messages)").all();

if (!columns.some(column => column.name === "delivered")) {
    db.exec(`
        ALTER TABLE messages
        ADD COLUMN delivered INTEGER NOT NULL DEFAULT 0
    `);
}

console.log("Message delivery tracking ready.");

console.log("Walkerline database connected.");
// Temporary identity for the local node test
const phoneB = generateKeys();

console.log("Phone B encryption keys generated.");
const PORT = 3000;

const server = http.createServer((req, res) => {

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.writeHead(204);
        return res.end();
    }

    // Receive a message with duplicate protection
if (req.method === "POST" && req.url === "/messages") {
    let body = "";
    let bodyTooLarge = false;

    req.on("data", chunk => {
        if (body.length + chunk.length > 100000) {
            bodyTooLarge = true;
            return;
        }

        if (!bodyTooLarge) {
            body += chunk;
        }
    });

    req.on("end", () => {
        try {
            if (bodyTooLarge) {
                res.writeHead(413);
                return res.end(JSON.stringify({
                    error: "Message payload is too large."
                }));
            }

            const message = JSON.parse(body);

            const validEnvelope =
                message.encrypted &&
                typeof message.encrypted === "object" &&
                typeof message.encrypted.ephemeralPublicKey === "string" &&
                typeof message.encrypted.salt === "string" &&
                typeof message.encrypted.iv === "string" &&
                typeof message.encrypted.authTag === "string" &&
                typeof message.encrypted.ciphertext === "string";

            if (
                typeof message.sender !== "string" ||
                !message.sender.trim() ||
                typeof message.recipient !== "string" ||
                !message.recipient.trim() ||
                typeof message.messageId !== "string" ||
                !message.messageId.trim() ||
                message.messageId.length > 128 ||
                !validEnvelope
            ) {
                res.writeHead(400);
                return res.end(JSON.stringify({
                    error: "Invalid sender, recipient, message ID or encrypted envelope."
                }));
            }

            const content = JSON.stringify(message.encrypted);

            const result = db.prepare(`
                INSERT OR IGNORE INTO messages
                (id, sender, recipient, content, createdAt)
                VALUES (?, ?, ?, ?, ?)
            `).run(
                message.messageId,
                message.sender.trim(),
                message.recipient.trim(),
                content,
                new Date().toISOString()
            );

            if (result.changes === 0) {
                const existing = db.prepare(`
                    SELECT sender, recipient, content
                    FROM messages
                    WHERE id = ?
                `).get(message.messageId);

                const identical =
                    existing &&
                    existing.sender === message.sender.trim() &&
                    existing.recipient === message.recipient.trim() &&
                    existing.content === content;

                if (!identical) {
                    res.writeHead(409);
                    return res.end(JSON.stringify({
                        error: "Message ID already exists with different content."
                    }));
                }

                res.writeHead(200);
                return res.end(JSON.stringify({
                    status: "already_stored",
                    messageId: message.messageId
                }));
            }

            res.writeHead(201);
            return res.end(JSON.stringify({
                status: "stored",
                messageId: message.messageId
            }));

        } catch (error) {
            console.error("Message storage error:", error);

            res.writeHead(400);
            return res.end(JSON.stringify({
                error: "Invalid message request."
            }));
        }
    });

    return;
}

    // Acknowledge a successfully received message
if (
    req.method === "POST" &&
    /^\/messages\/[^/]+\/ack$/.test(req.url)
) {
    const messageId = decodeURIComponent(
        req.url.split("/")[2] || ""
    );

    const result = db.prepare(`
        UPDATE messages
        SET delivered = 1
        WHERE id = ?
    `).run(messageId);

    if (result.changes === 0) {
        res.writeHead(404);
        return res.end(JSON.stringify({
            error: "Message not found."
        }));
    }

    res.writeHead(200);
    return res.end(JSON.stringify({
        status: "acknowledged",
        messageId: messageId
    }));
}

// Retrieve only messages not yet acknowledged
if (req.method === "GET" && req.url.startsWith("/messages/")) {
    const recipient = decodeURIComponent(
        req.url.split("/")[2] || ""
    );

    const messages = db.prepare(`
        SELECT * FROM messages
        WHERE recipient = ?
        AND delivered = 0
        ORDER BY createdAt ASC
    `).all(recipient);

    res.writeHead(200);
    return res.end(JSON.stringify(messages));
}

    // Node status
    if (req.method === "GET" && req.url === "/") {
        res.writeHead(200);
        return res.end(JSON.stringify({
            node: "Walkerline",
            status: "online",
            storedMessages: db.prepare("SELECT COUNT(*) AS total FROM messages").get().total
        }));
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: "Route not found." }));
});

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Walkerline node running on port ${PORT}`);
});