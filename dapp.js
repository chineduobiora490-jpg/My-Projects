// ==========================================
// NEWSFEED TIMELINE STREAM ENGINE
// ==========================================

const SUPABASE_URL = "https://gqyfhcazwmdfzbajlaim.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxeWZoY2F6d21kZnpiYWpsYWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4NzY1MTAsImV4cCI6MjEwNzQ1MjUxMH0.OkreYtrTKM2YCh8W4e6W8UzcvnDW2rAvCnMhVzeMLgE";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const avatarUrlCache = new Map();

let currentUser = null;
let currentUsername = "Guest Profile";
let hasSavedProfile = false;

function authHeaders(extra = {}) {
    return {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        ...extra
    };
}

async function authenticatedHeaders(extra = {}) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) throw new Error("Please log in first.");
    return {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${session.access_token}`,
        ...extra
    };
}

function showAuthMessage(message, isError = false) {
    const el = document.getElementById("authMessage");
    if (!el) return;
    el.textContent = message;
    el.style.color = isError ? "#d93025" : "";
}

function setLoggedInUI(user, username = "") {
    currentUser = user || null;
    hasSavedProfile = Boolean(user && username);
    currentUsername = username || user?.user_metadata?.username || "Member";

    const authSection = document.getElementById("authSection");
    const loggedInSection = document.getElementById("loggedInSection");
    const navUserDisplay = document.getElementById("navUserDisplay");
    const accountDisplay = document.getElementById("accountDisplay");
    const usernameInput = document.getElementById("usernameInput");

    if (authSection) authSection.hidden = Boolean(user);
    if (loggedInSection) loggedInSection.hidden = !user;
    if (navUserDisplay) navUserDisplay.textContent = user ? currentUsername : "Guest Profile";

    if (accountDisplay && user) {
        accountDisplay.textContent =
            `Logged in as ${user.email || "member"} · Display name: ${currentUsername}`;
    }

    if (usernameInput && user && username) usernameInput.value = username;
}

document.getElementById("saveProfileBtn")?.addEventListener("click", async () => {
    if (!currentUser) {
        return showAuthMessage("Log in first.", true);
    }

console.log("Save Profile button clicked");
showAuthMessage("Save button clicked!");

    const usernameInput = document.getElementById("usernameInput");
    const username = usernameInput?.value.trim();
    const bioInput = document.getElementById("bioInput");
    const bio = bioInput?.value.trim() || "";

    if (!username) {
        return showAuthMessage("Enter a display name.", true);
    }

    try {
        const headers = await authenticatedHeaders({
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        });
        
        const selectedPicture =croppedProfilePicture ||document.getElementById("profilePictureInput")?.files?.[0];
        let avatarPath = null;

    if (selectedPicture) {
    if (!selectedPicture.type.startsWith("image/")) {
        throw new Error("Please select an image file.");
    }

    if (selectedPicture.size > 2 * 1024 * 1024) {
        throw new Error("Choose an image smaller than 2 MB.");
    }

    const fileExtension = selectedPicture.name.split(".").pop();
    const filePath = `${currentUser.id}/profile-${Date.now()}.${fileExtension}`;

    const { data: uploadData, error: uploadError } =
        await supabaseClient.storage
            .from("avatars")
            .upload(filePath, selectedPicture, {
                upsert: true,
                contentType: selectedPicture.type
            });

    if (uploadError) throw uploadError;

    avatarPath = uploadData.path;
}
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(currentUser.id)}`,
            {
                method: "PATCH",
                headers,
                body: JSON.stringify({username,bio,...
                (avatarPath ? { avatar_url: avatarPath } : {})
    })
            }
        );
        
console.log("Profile update status:", response.status);
console.log("Profile update response:", await response.clone().text());
        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.message || "Could not save display name.");
        }

        const updatedProfiles = await response.json();

        if (!updatedProfiles.length) {
            throw new Error("No profile was updated. Check your profile permissions.");
        }

        currentUsername = username;
        hasSavedProfile = true;
        setLoggedInUI(currentUser, username);
        console.log("About to show the success message");
        showAuthMessage("Display name saved.");
        await fetchAndRenderFeed();

    } catch (error) {
        console.error("Save profile error:", error);
        showAuthMessage(error.message || "Profile update failed.", true);
    }
});


async function loadOrCreateProfile(user) {
    if (!user) return;

    currentUser = user;

    // Check whether this user's profile already exists.
    const { data: profile, error: fetchError } = await supabaseClient
        .from("profiles")
        .select("id, username, ble_device_id, bio, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

    if (fetchError) {
        throw fetchError;
    }

    let savedProfile = profile;

    // Create a profile only when one does not exist.
    if (!savedProfile) {
        const desiredName =
            user.user_metadata?.username ||
            (user.email ? user.email.split("@")[0] : "Member");

        const { data: newProfile, error: insertError } =
            await supabaseClient
                .from("profiles")
                .insert({
                    id: user.id,
                    username: desiredName
                })
                .select("id, username, ble_device_id, bio, avatar_url")
                .single();

        if (insertError) {
            // Another startup/auth callback may have created it first.
            if (insertError.code === "23505") {
                const { data: existingProfile, error: retryError } =
                    await supabaseClient
                        .from("profiles")
                        .select("id, username, ble_device_id, bio, avatar_url")
                        .eq("id", user.id)
                        .maybeSingle();

                if (retryError) throw retryError;
                if (!existingProfile) throw insertError;

                savedProfile = existingProfile;
            } else {
                throw insertError;
            }
        } else {
            savedProfile = newProfile;
        }
    }

    currentUsername =
        savedProfile.username ||
        user.user_metadata?.username ||
        "Member";

    hasSavedProfile = Boolean(savedProfile.username);

    setLoggedInUI(user, currentUsername);
    // Restore the saved bio.
const bioInput = document.getElementById("bioInput");
if (bioInput) {
    bioInput.value = savedProfile.bio || "";
}

// Restore the saved profile picture.
const picturePreview = document.getElementById("profilePicturePreview");

if (picturePreview) {
    if (savedProfile.avatar_url) {
        const { data, error } = await supabaseClient.storage
            .from("avatars")
            .createSignedUrl(savedProfile.avatar_url, 3600);

        if (error) {
            console.error("Could not load profile picture:", error);
        } else {
            picturePreview.src = data.signedUrl;
        }
    } else {
        picturePreview.src = "https://placehold.co/120x120?text=Profile";
    }
    }
}


document.getElementById("signUpBtn")?.addEventListener("click", async () => {
    const username = document.getElementById("usernameInput").value.trim();
    const email = document.getElementById("emailInput").value.trim();
    const password = document.getElementById("passwordInput").value;

    if (!username || !email || !password) {
        showAuthMessage("Enter a display name, email, and password.", true);
        return;
    }

    if (password.length < 6) {
        showAuthMessage("Use a password with at least 6 characters.", true);
        return;
    }

    try {
        showAuthMessage("Creating your account…");

        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: { data: { username } }
        });

        if (error) throw error;

        if (data.session && data.user) {
            await loadOrCreateProfile(data.user);
            showAuthMessage("Account created and you're signed in.");
        } else {
            showAuthMessage(
                "Account created. Check your email to confirm it, then log in."
            );
        }
    } catch (error) {
        showAuthMessage(error.message || "Sign-up failed.", true);
    }
});

document.getElementById("loginBtn")?.addEventListener("click", async () => {
    const email = document.getElementById("emailInput").value.trim();
    const password = document.getElementById("passwordInput").value;

    if (!email || !password) {
        showAuthMessage("Enter your email and password.", true);
        return;
    }

    try {
        showAuthMessage("Logging in…");

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        await loadOrCreateProfile(data.user);
        showAuthMessage("You're logged in.");
        await fetchAndRenderFeed();
    } catch (error) {
        showAuthMessage(error.message || "Login failed.", true);
    }
});

document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        showAuthMessage(error.message, true);
        return;
    }

    currentUser = null;
    currentUsername = "Guest Profile";
    hasSavedProfile = false;
    setLoggedInUI(null);
    showAuthMessage("You've logged out.");
});


document.getElementById("connectBtn")?.addEventListener("click", async () => {
    const statusDiv = document.getElementById("status");

    if (!currentUser) {
        if (statusDiv) statusDiv.textContent = "Log in before linking a Bluetooth device.";
        return;
    }

    if (!navigator.bluetooth) {
        if (statusDiv) {
            statusDiv.textContent =
                "Bluetooth is not supported. Try Chrome or Edge on localhost or HTTPS.";
        }
        return;
    }

    try {
        const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true
        });

        if (statusDiv) statusDiv.textContent = "Saving Bluetooth device…";

        const headers = await authenticatedHeaders({
            "Content-Type": "application/json",
            Prefer: "return=minimal"
        });

        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(currentUser.id)}`,
            {
                method: "PATCH",
                headers,
                body: JSON.stringify({ ble_device_id: device.id })
            }
        );
console.log("Profile update status:", response.status);
console.log("Profile update response:", await response.clone().text());
        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.message || "Could not save Bluetooth device.");
        }

        if (statusDiv) {
            statusDiv.textContent = `Linked device: ${device.name || "Bluetooth device"}`;
        }
    } catch (error) {
        if (statusDiv) statusDiv.textContent = `Bluetooth error: ${error.message}`;
    }
});


async function loadFollowSummary(userIds) {
    const summary = new Map();

    userIds.forEach(id => {
        summary.set(id, { followers: 0, following: false });
    });

    if (!userIds.length || !currentUser) return summary;

    const ids = [...new Set(userIds)]
        .filter(Boolean)
        .map(id => `"${id}"`)
        .join(",");

    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/follows?select=follower_id,following_id&following_id=in.(${ids})`,
        { headers: await authenticatedHeaders() }
    );

    const rows = await response.json();

    if (!response.ok) {
        throw new Error(rows.message || "Could not load follow information.");
    }

    rows.forEach(row => {
        const item = summary.get(row.following_id);
        if (item) item.followers++;

        if (row.follower_id === currentUser.id) {
            const followedUser = summary.get(row.following_id);
            if (followedUser) followedUser.following = true;
        }
    });

    return summary;
}

async function loadMessagingUsers() {
    const conversationsList = document.getElementById("conversationsList");

    if (!conversationsList || !currentUser) return;

    conversationsList.textContent = "Loading people...";

    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/profiles?select=id,username,avatar_url&order=username.asc`,
            { headers: authHeaders() }
        );

        const users = await response.json();

        if (!response.ok) {
            throw new Error(users.message || "Could not load users.");
        }

        conversationsList.replaceChildren();

        const otherUsers = users.filter(
            user => user.id !== currentUser.id
        );

        if (otherUsers.length === 0) {
            conversationsList.textContent = "No other users found yet.";
            return;
        }

        otherUsers.forEach(user => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "conversation-user";
            button.textContent = user.username || "Member";

            button.addEventListener("click", () => {
                openChatConversation(user);
            });

            conversationsList.appendChild(button);
        });
    } catch (error) {
        console.error("Could not load messaging users:", error);
        conversationsList.textContent = "Could not load people.";
    }
}

async function openChatConversation(user) {
    const chatHeader = document.getElementById("chatHeader");
    const chatMessages = document.getElementById("chatMessages");
    const messageInput = document.getElementById("messageInput");
    const sendMessageBtn = document.getElementById("sendMessageBtn");

    if (!user || !chatHeader || !chatMessages) return;

    chatHeader.replaceChildren();

    const heading = document.createElement("h4");
    heading.textContent = user.username || "Member";
    chatHeader.appendChild(heading);

    chatMessages.replaceChildren();

const placeholder = document.createElement("p");
placeholder.textContent = "Opening conversation...";
chatMessages.appendChild(placeholder);

messageInput.disabled = true;
sendMessageBtn.disabled = true;

try {
    const { data: conversationId, error } = await supabaseClient.rpc(
        "start_or_get_conversation",
        { p_recipient_id: user.id }
    );

    if (error) throw error;

    window.activeConversationId = conversationId;
    window.activeChatUser = user;

    await loadChatMessages(conversationId);

messageInput.disabled = false;
sendMessageBtn.disabled = false;

} catch (error) {
    console.error("Could not open conversation:", error);
    placeholder.textContent = "Could not open conversation. Check the console for details.";
}

    if (messageInput) {
        messageInput.disabled = false;
        messageInput.placeholder = `Message ${user.username || "Member"}...`;
        messageInput.focus();
    }

    if (sendMessageBtn) {
        sendMessageBtn.disabled = false;
    }
}

async function loadChatMessages(conversationId) {
    const chatMessages = document.getElementById("chatMessages");

    if (!chatMessages || !conversationId) return;

    chatMessages.textContent = "Loading messages...";

    try {
        const { data: messages, error } = await supabaseClient
            .from("messages")
            .select("id, conversation_id, sender_id, content, created_at")
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: true });

        if (error) throw error;

        chatMessages.replaceChildren();

        if (!messages || messages.length === 0) {
            const emptyMessage = document.createElement("p");
            emptyMessage.textContent = "No messages yet. Start the conversation!";
            chatMessages.appendChild(emptyMessage);
            return;
        }

        messages.forEach(message => {
            const bubble = document.createElement("div");
            bubble.className =
                message.sender_id === currentUser.id
                    ? "message-bubble message-mine"
                    : "message-bubble message-theirs";

            bubble.textContent = message.content;
            chatMessages.appendChild(bubble);
        });

        chatMessages.scrollTop = chatMessages.scrollHeight;

    } catch (error) {
        console.error("Could not load messages:", error);
        chatMessages.textContent = "Could not load messages.";
    }
}

document.getElementById("messageForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const messageInput = document.getElementById("messageInput");
    const sendMessageBtn = document.getElementById("sendMessageBtn");
    const content = messageInput.value.trim();
    const conversationId = window.activeConversationId;

    if (!content || !conversationId || !currentUser) return;

    sendMessageBtn.disabled = true;

    try {
        const { error } = await supabaseClient
            .from("messages")
            .insert({
                conversation_id: conversationId,
                sender_id: currentUser.id,
                content: content
            });

        if (error) throw error;

        messageInput.value = "";
        await loadChatMessages(conversationId);

    } catch (error) {
        console.error("Could not send message:", error);
        alert("Message could not be sent. Check the browser console for details.");
    } finally {
        sendMessageBtn.disabled = false;
        messageInput.focus();
    }
});

async function loadProfileFollowCounts(profileId) {
    const followerCountEl = document.getElementById("viewedFollowerCount");
    const followingCountEl = document.getElementById("viewedFollowingCount");

    if (!profileId) return;

    try {
        const [followersResult, followingResult] = await Promise.all([
            supabaseClient
                .from("follows")
                .select("follower_id", { count: "exact", head: true })
                .eq("following_id", profileId),

            supabaseClient
                .from("follows")
                .select("following_id", { count: "exact", head: true })
                .eq("follower_id", profileId)
        ]);

        if (followersResult.error) throw followersResult.error;
        if (followingResult.error) throw followingResult.error;

        if (followerCountEl) {
            followerCountEl.textContent =
                `${followersResult.count ?? 0} followers`;
        }

        if (followingCountEl) {
            followingCountEl.textContent =
                `${followingResult.count ?? 0} following`;
        }
    } catch (error) {
        console.error("Could not load profile follow counts:", error);
    }
}

window.toggleFollow = async function(targetUserId, alreadyFollowing) {
    if (!currentUser) {
        alert("Please log in to follow people.");
        return;
    }

    if (targetUserId === currentUser.id) return;

    try {
        const headers = await authenticatedHeaders({
            "Content-Type": "application/json",
            Prefer: "return=minimal"
        });

        const url =
            `${SUPABASE_URL}/rest/v1/follows` +
            `?follower_id=eq.${encodeURIComponent(currentUser.id)}` +
            `&following_id=eq.${encodeURIComponent(targetUserId)}`;

        const response = alreadyFollowing
    ? await fetch(url, {
        method: "DELETE",
        headers
    })
    : await fetch(
        `${SUPABASE_URL}/rest/v1/follows?on_conflict=follower_id,following_id`,
        {
            method: "POST",
            headers: {
                ...headers,
                Prefer: "resolution=ignore-duplicates,return=minimal"
            },
            body: JSON.stringify({
                follower_id: currentUser.id,
                following_id: targetUserId
            })
        }
    );

        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.message || "Could not update follow.");
        }

        await fetchAndRenderFeed();
    } catch (error) {
        alert(`Follow error: ${error.message}`);
    }
};

async function fetchAndRenderFeed() {
    const feedStream = document.getElementById("newsfeedStream");
    if (!feedStream) return;

    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/posts?select=id,content,created_at,user_id,profiles(id,username,avatar_url),likes(user_id),comments(id,content,user_id,profiles(username,avatar_url))&order=created_at.desc`,
            { headers: authHeaders() }
        );

        const posts = await response.json();

        if (!response.ok) {
            throw new Error(posts.message || "Could not load feed.");
        }
        const authorIds = posts
        .map(post => post.profiles?.id || post.user_id)
        .filter(Boolean);

        const followSummary = await loadFollowSummary(authorIds);
        feedStream.replaceChildren();

        posts.forEach(async post => {
            const authorId = post.profiles?.id || post.user_id;
            const authorName = post.profiles?.username || "Unknown User";
            const initials = authorName.slice(0, 2).toUpperCase();

            const timeFormatted = post.created_at
                ? new Date(post.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                })
                : "";

            const likes = post.likes || [];
            const userHasLiked = Boolean(
                currentUser && likes.some(like => like.user_id === currentUser.id)
            );

            const card = document.createElement("div");
            card.className = "fb-card feed-post";
            card.style.cssText = "margin-bottom:20px;padding-bottom:0;overflow:hidden;";

            const header = document.createElement("div");
            header.className = "post-header";

            const avatar = document.createElement("div");
            avatar.className = "avatar";

       if (post.profiles?.avatar_url) {
    const avatarPath = post.profiles.avatar_url;
    let cachedAvatar = avatarUrlCache.get(avatarPath);
    console.log("TESTING AVATAR OBJECT:", avatarPath);

const folder = avatarPath.split("/")[0];
const filename = avatarPath.split("/")[1];

const { data: fileList, error: listError } =
    await supabaseClient.storage
        .from("avatars")
        .list(folder);

console.log("AVATAR FOLDER:", folder);
console.log("EXPECTED FILENAME:", filename);
console.log(
    "FILES ACTUALLY IN FOLDER:",
    JSON.stringify(fileList?.map(file => file.name), null, 2)
);
console.log("STORAGE LIST ERROR:", listError);

    if (!cachedAvatar || cachedAvatar.expiresAt <= Date.now()) {
        const { data, error } = await supabaseClient.storage
            .from("avatars")
            .createSignedUrl(avatarPath, 3600);

        
if (!error && data?.signedUrl) {
    cachedAvatar = {
        url: data.signedUrl,
        expiresAt: Date.now() + 50 * 60 * 1000
    };

    avatarUrlCache.set(avatarPath, cachedAvatar);
} else {
    console.error("Avatar signing failed:", {
        avatarPath,
        message: error?.message,
        statusCode: error?.statusCode,
        error: error?.error
    });

    cachedAvatar = null;
}

    }

    if (cachedAvatar) {
        const avatarImage = document.createElement("img");
        avatarImage.src = cachedAvatar.url;
        avatarImage.alt = `${authorName}'s profile picture`;
        avatarImage.className = "feed-avatar-image";
        avatar.appendChild(avatarImage);
    } else {
        avatar.textContent = initials;
    }
} else {
    avatar.textContent = initials;
}
            const meta = document.createElement("div");

            const author = document.createElement("div");
author.className = "post-author";
author.textContent = authorName;
author.style.cursor = "pointer";
author.title = "View profile";

author.addEventListener("click", () => {
    window.openUserProfile(authorId);
});

            const time = document.createElement("div");
            time.className = "post-time";
            time.textContent = timeFormatted;

            
meta.append(author, time);

header.append(avatar, meta);

const followArea = document.createElement("div");
followArea.style.cssText =
    "margin-left:auto;display:flex;align-items:center;gap:8px;";

const followCount = document.createElement("span");
followCount.className = "follow-count";
followCount.textContent = "Followers: …";
followArea.append(followCount);

if (currentUser && authorId !== currentUser.id) {
    const followButton = document.createElement("button");
    followButton.className = "fb-btn fb-btn-secondary";
    const followInfo = followSummary.get(authorId);
const isFollowing = followInfo?.following || false;

followButton.textContent = isFollowing ? "Following" : "Follow";
followCount.textContent =
    `Followers: ${followInfo?.followers ?? 0}`;

followButton.addEventListener("click", () => {
    window.toggleFollow(authorId, isFollowing);
});

    followArea.append(followButton);
}

header.append(followArea);


            const body = document.createElement("div");
            body.className = "post-body";
            body.textContent = post.content || "";

            const engagement = document.createElement("div");
            engagement.className = "engagement-bar";

            const likeButton = document.createElement("button");
            likeButton.className =
                `engagement-btn ${userHasLiked ? "active" : ""}`;
            likeButton.textContent = `👍 Like (${likes.length})`;
            likeButton.addEventListener("click", () =>
                window.toggleLike(post.id, userHasLiked)
            );

            const commentFocus = document.createElement("button");
            commentFocus.className = "engagement-btn";
            commentFocus.textContent = "💬 Comment";
            engagement.append(likeButton, commentFocus);

            const commentsSection = document.createElement("div");
            commentsSection.className = "comments-section";

            const commentList = document.createElement("div");
            commentList.id = `comment-list-${post.id}`;

            (post.comments || []).forEach(comment => {
                const commentCard = document.createElement("div");
                commentCard.className = "comment-card";

                const commentAuthor = document.createElement("div");
                commentAuthor.className = "comment-author";
                commentAuthor.textContent = comment.profiles?.username || "Member";

                const commentBody = document.createElement("div");
                commentBody.textContent = comment.content || "";

                commentCard.append(commentAuthor, commentBody);
                commentList.append(commentCard);
            });

            const inputRow = document.createElement("div");
            inputRow.className = "comment-input-row";

            const input = document.createElement("input");
            input.type = "text";
            input.id = `c-box-${post.id}`;
            input.className = "comment-box";
            input.placeholder = "Write a comment…";

            const send = document.createElement("button");
            send.className = "fb-btn comment-submit-btn";
            send.textContent = "Send";
            send.addEventListener("click", () => window.submitComment(post.id));

            inputRow.append(input, send);
            commentFocus.addEventListener("click", () => input.focus());

            commentsSection.append(commentList, inputRow);
            card.append(header, body, engagement, commentsSection);
            feedStream.append(card);
        });
    } catch (error) {
        console.error("Feed error:", error);
    }
}
window.openUserProfile = async function (profileId) {
    if (!profileId) return;

    const profileName = document.getElementById("viewedProfileName");
    const profileBio = document.getElementById("viewedProfileBio");
    const profilePicture = document.getElementById("viewedProfilePicture");
    const profilePosts = document.getElementById("viewedProfilePosts");

    try {
        profileName.textContent = "Loading profile...";
        profileBio.textContent = "";
        profilePosts.textContent = "Loading posts...";

        // Open the main Profile tab.
        const profileTab = document.querySelector(
            '.nav-tab[data-panel="profilePanel"]'
        );

        profileTab?.click();

        // Open the Posts section inside the Profile tab.
        document.querySelector(
            '.nested-tab[data-subpanel="profilePostsView"]'
        )?.click();

        // Load the selected user's profile.
        const { data: profile, error } = await supabaseClient
            .from("profiles")
            .select("id, username, bio, avatar_url")
            .eq("id", profileId)
            .single();

        if (error) throw error;

        profileName.textContent = profile.username || "Member";
        await loadProfileFollowCounts(profileId);
        profileBio.textContent = profile.bio || "No bio added yet.";

        profilePicture.src = "https://placehold.co/120x120?text=Profile";

        if (profile.avatar_url) {
            const { data, error: imageError } = await supabaseClient
                .storage
                .from("avatars")
                .createSignedUrl(profile.avatar_url, 3600);

            if (!imageError && data?.signedUrl) {
                profilePicture.src = data.signedUrl;
            }
        }

        // Load this user's posts.
        const { data: posts, error: postsError } = await supabaseClient
            .from("posts")
            .select("id, content, created_at")
            .eq("user_id", profileId)
            .order("created_at", { ascending: false });

        if (postsError) throw postsError;

        profilePosts.replaceChildren();

        if (!posts || posts.length === 0) {
            profilePosts.textContent = "No posts yet.";
        } else {
            posts.forEach(post => {
                const postCard = document.createElement("div");
                postCard.className = "profile-post-item";

                const content = document.createElement("p");
                content.textContent = post.content || "";

                const date = document.createElement("small");
                date.textContent = post.created_at
                    ? new Date(post.created_at).toLocaleString()
                    : "";

                postCard.append(content, date);
                profilePosts.appendChild(postCard);
            });
        }

    } catch (error) {
        console.error("Could not open profile:", error);
        profileName.textContent = "Could not load profile";
        profilePosts.textContent =
            "There was a problem loading this profile. Check the console for details.";
    }
};
// Load your own profile when you click the Profile tab.
document.querySelector(
    '.nav-tab[data-panel="profilePanel"]'
)?.addEventListener("click", (event) => {
    if (event.isTrusted && currentUser) {
        window.openUserProfile(currentUser.id);
    }
});

window.toggleLike = async function(postId, alreadyLiked) {
    if (!currentUser) return alert("Please log in to like posts.");

    try {
        const headers = await authenticatedHeaders({
            "Content-Type": "application/json",
            Prefer: "return=minimal"
        });

        let response;

        if (alreadyLiked) {
            response = await fetch(
                `${SUPABASE_URL}/rest/v1/likes?post_id=eq.${encodeURIComponent(postId)}&user_id=eq.${encodeURIComponent(currentUser.id)}`,
                { method: "DELETE", headers }
            );
        } else {
            response = await fetch(`${SUPABASE_URL}/rest/v1/likes`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    post_id: postId,
                    user_id: currentUser.id
                })
            });
        }

        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.message || "Could not update like.");
        }

        await fetchAndRenderFeed();
    } catch (error) {
        alert(`Like error: ${error.message}`);
    }
};

window.submitComment = async function(postId) {
    if (!currentUser) return alert("Please log in to comment.");

    const inputField = document.getElementById(`c-box-${postId}`);
    const content = inputField?.value.trim();

    if (!content) return;

    try {
        const headers = await authenticatedHeaders({
            "Content-Type": "application/json",
            Prefer: "return=minimal"
        });

        const response = await fetch(`${SUPABASE_URL}/rest/v1/comments`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                post_id: postId,
                user_id: currentUser.id,
                content
            })
        });

        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.message || "Could not post comment.");
        }

        inputField.value = "";
        await fetchAndRenderFeed();
    } catch (error) {
        alert(`Comment error: ${error.message}`);
    }
};

document.getElementById("publishPostBtn")?.addEventListener("click", async () => {
    const postInput = document.getElementById("postInput");
    const content = postInput.value.trim();

    if (!content) return alert("Write something before publishing.");
    if (!currentUser) return alert("Please log in before publishing.");

    try {
        const headers = await authenticatedHeaders({
            "Content-Type": "application/json",
            Prefer: "return=minimal"
        });

        const response = await fetch(`${SUPABASE_URL}/rest/v1/posts`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                user_id: currentUser.id,
                content
            })
        });

        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.message || "Could not publish post.");
        }

        postInput.value = "";
        await fetchAndRenderFeed();
    } catch (error) {
        alert(`Posting error: ${error.message}`);
    }
});

async function scanAndMatchNearbyDevices() {
    const radarList = document.getElementById("radarTargetList");
    if (!radarList) return;

    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/profiles?select=username,ble_device_id&ble_device_id=not.is.null`,
            { headers: authHeaders() }
        );

        const registeredUsers = await response.json();

        if (!response.ok) {
            throw new Error(registeredUsers.message || "Could not load radar profiles.");
        }

        if (!navigator.bluetooth) {
            radarList.textContent =
                "Bluetooth is not supported in this browser. Try Chrome or Edge.";
            return;
        }

        if (typeof navigator.bluetooth.getDevices !== "function") {
            radarList.textContent =
                "This browser cannot list previously authorized Bluetooth devices. Use Link BLE Device to select a device.";
            return;
        }

        const devices = await navigator.bluetooth.getDevices();

        const matches = devices
            .map(device =>
                registeredUsers.find(profile => profile.ble_device_id === device.id)
            )
            .filter(Boolean);

        radarList.replaceChildren();

        if (!matches.length) {
            radarList.textContent = "No matching authorized beacons found.";
            return;
        }

        matches.forEach(profile => {
            const row = document.createElement("div");
            row.className = "nearby-user";

            const name = document.createElement("div");
            name.style.cssText = "font-weight:600;font-size:14px;";
            name.textContent = profile.username || "Member";

            row.append(name);
            radarList.append(row);
        });
    } catch (error) {
        console.error("Radar error:", error);
    }
}

supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    if (!session?.user) {
        setLoggedInUI(null);
        return;
    }

    try {
        await loadOrCreateProfile(session.user);
    } catch (error) {
        console.error("Profile setup error:", error);
        showAuthMessage(error.message || "Could not load profile.", true);
    }
});

(async function initializeWalkerline() {
    const { data: { session }, error } = await supabaseClient.auth.getSession();

    if (error) console.error("Session error:", error);

    if (session?.user) {
        try {
            await loadOrCreateProfile(session.user);
        } catch (err) {
            console.error("Profile setup error:", err);
        }
    } else {
        setLoggedInUI(null);
    }

    await fetchAndRenderFeed();
    await scanAndMatchNearbyDevices();

    setInterval(fetchAndRenderFeed, 10000);
    setInterval(scanAndMatchNearbyDevices, 15000);

    console.log("Walkerline loaded.");
})();


let profileCropper = null;
let croppedProfilePicture = null;

const profilePictureInput = document.getElementById("profilePictureInput");
const cropModal = document.getElementById("cropModal");
const imageToCrop = document.getElementById("imageToCrop");

profilePictureInput?.addEventListener("change", () => {
    const file = profilePictureInput.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        showAuthMessage("Please select an image file.", true);
        profilePictureInput.value = "";
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        showAuthMessage("Choose an image smaller than 10 MB.", true);
        profilePictureInput.value = "";
        return;
    }

    if (typeof Cropper === "undefined") {
        showAuthMessage("The cropping tool did not load. Refresh and try again.", true);
        return;
    }

    if (profileCropper) {
        profileCropper.destroy();
        profileCropper = null;
    }

    croppedProfilePicture = null;
    imageToCrop.src = URL.createObjectURL(file);
    cropModal.hidden = false;

    imageToCrop.onload = () => {
        profileCropper = new Cropper(imageToCrop, {
            aspectRatio: 1,
            viewMode: 1,
            dragMode: "move",
            autoCropArea: 0.8,
            responsive: true,
            background: false
        });
    };
});

document.getElementById("zoomInBtn")?.addEventListener("click", () => {
    profileCropper?.zoom(0.1);
});

document.getElementById("zoomOutBtn")?.addEventListener("click", () => {
    profileCropper?.zoom(-0.1);
});

document.getElementById("cancelCropBtn")?.addEventListener("click", () => {
    cropModal.hidden = true;

    profileCropper?.destroy();
    profileCropper = null;

    profilePictureInput.value = "";
    croppedProfilePicture = null;
});

document.getElementById("applyCropBtn")?.addEventListener("click", () => {
    if (!profileCropper) return;

    profileCropper.getCroppedCanvas({
        width: 400,
        height: 400,
        imageSmoothingQuality: "high"
    }).toBlob((blob) => {
        if (!blob) {
            showAuthMessage("Could not crop this image. Please try another.", true);
            return;
        }

        croppedProfilePicture = new File(
            [blob],
            "profile-picture.jpg",
            { type: "image/jpeg" }
        );

        const preview = document.getElementById("profilePicturePreview");
        if (preview) {
            preview.src = URL.createObjectURL(croppedProfilePicture);
        }

        cropModal.hidden = true;
        profileCropper.destroy();
        profileCropper = null;

        showAuthMessage("Photo cropped. Click Save Profile to upload it.");
    }, "image/jpeg", 0.9);
});

/* ===== WALKERLINE NESTED TAB NAVIGATION ===== */

document.querySelectorAll(".nav-tab").forEach(button => {
    button.addEventListener("click", () => {
        const targetId = button.dataset.panel;
        const targetPanel = document.getElementById(targetId);

        if (!targetPanel) return;

        // Activate the selected main tab
        document.querySelectorAll(".nav-tab").forEach(tab => {
            tab.classList.toggle("active", tab === button);
        });

        // Show only the selected main panel
        document.querySelectorAll(".content-panel").forEach(panel => {
            panel.classList.toggle("active", panel === targetPanel);
        });
    });
});

document.querySelectorAll(".nested-tab").forEach(button => {
    button.addEventListener("click", () => {
        const targetId = button.dataset.subpanel;
        const targetPanel = document.getElementById(targetId);

        if (!targetPanel) return;

        // Find the nested-tab group containing this button
        const tabGroup = button.closest(".nested-tabs");
        const parentPanel = button.closest(".content-panel");

        if (!tabGroup || !parentPanel) return;

        // Highlight the selected nested tab
        tabGroup.querySelectorAll(".nested-tab").forEach(tab => {
            tab.classList.toggle("active", tab === button);
        });

        // Show the selected nested panel only
        parentPanel.querySelectorAll(".nested-panel").forEach(panel => {
            panel.classList.toggle("active", panel === targetPanel);
        });
    });
});
/* TEMPORARY: Check Walkerline authentication */
(async () => {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
        console.error("Authentication check failed:", error.message);
        return;
    }

    console.log(
        "Walkerline session:",
        data.session ? "SIGNED IN" : "NOT SIGNED IN"
    );
})();

/* ===== WALKERLINE: LOAD MESSAGE REQUESTS ===== */
async function loadMessageRequests() {
    const list = document.getElementById("messageRequestsList");

    if (!list) return;

    list.textContent = "Loading message requests...";

    try {
        const { data: { user }, error: userError } =
            await supabaseClient.auth.getUser();

        if (userError) throw userError;

        if (!user) {
            list.textContent = "Please sign in to view message requests.";
            return;
        }

        const { data: requests, error } = await supabaseClient
            .from("message_requests")
            .select("id, sender_id, content, created_at")
            .eq("recipient_id", user.id)
            .eq("status", "pending")
            .order("created_at", { ascending: false });

        if (error) throw error;

        list.replaceChildren();

        if (!requests || requests.length === 0) {
            const empty = document.createElement("p");
            empty.textContent = "You have no new message requests.";
            list.appendChild(empty);
            return;
        }

        requests.forEach(request => {
            const card = document.createElement("div");
            card.className = "message-request-card";

            const sender = document.createElement("p");
            sender.textContent = "From: " + request.sender_id;

            const message = document.createElement("p");
            message.textContent = request.content;

            const date = document.createElement("small");
            date.textContent = new Date(request.created_at).toLocaleString();

            card.append(sender, message, date);
            list.appendChild(card);
        });
    } catch (error) {
        console.error("Could not load message requests:", error);
        list.textContent =
            "Could not load requests. Check the browser console for details.";
    }
}

/* Load when Walkerline starts */
loadMessageRequests();

/* Refresh when the user opens Messages */

document.querySelectorAll('.nav-tab[data-panel="messagesPanel"]')
    .forEach(button => {
        button.addEventListener("click", () => {
            loadMessageRequests();
            loadMessagingUsers();
        });
    });

