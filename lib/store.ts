import { Redis } from "@upstash/redis";

export type ChatUser = {
  lineUserId: string;
  displayName: string;
  pictureUrl?: string;
};

export type ChatMessage = {
  id: string;
  lineUserId: string;
  direction: "INBOUND" | "OUTBOUND";
  text: string;
  createdAt: string;
  markAsReadToken?: string;
};

const redis = Redis.fromEnv();

const USERS_KEY = "linechat:users";

function messagesKey(lineUserId: string) {
  return `linechat:messages:${lineUserId}`;
}

export async function upsertUser(user: ChatUser) {
  await redis.hset(USERS_KEY, {
    [user.lineUserId]: user,
  });
}

export async function getUsers(): Promise<ChatUser[]> {
  const users =
    await redis.hgetall<Record<string, ChatUser>>(
      USERS_KEY
    );

  return Object.values(users ?? {});
}

export async function getUser(
  lineUserId: string
): Promise<ChatUser | null> {
  const user =
    await redis.hget<ChatUser>(
      USERS_KEY,
      lineUserId
    );

  return user ?? null;
}

export async function addMessage(
  message: ChatMessage
) {
  const key = messagesKey(message.lineUserId);

  await redis.rpush(key, message);

  // เก็บ 200 ข้อความล่าสุด
  await redis.ltrim(key, -200, -1);
}

export async function getMessages(
  lineUserId: string
): Promise<ChatMessage[]> {
  const messages =
    await redis.lrange<ChatMessage>(
      messagesKey(lineUserId),
      0,
      -1
    );

  return messages ?? [];
}

export async function getLatestMarkAsReadToken(
  lineUserId: string
): Promise<string | undefined> {
  const messages =
    await getMessages(lineUserId);

  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];

    if (
      message.direction === "INBOUND" &&
      message.markAsReadToken
    ) {
      return message.markAsReadToken;
    }
  }

  return undefined;
}