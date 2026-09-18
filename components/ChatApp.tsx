"use client";

import { useEffect, useState } from "react";

type User = {
  lineUserId: string;
  displayName: string;
  pictureUrl?: string;
};

type Message = {
  id: string;
  lineUserId: string;
  direction: "INBOUND" | "OUTBOUND";
  text: string;
  createdAt: string;
};

export default function ChatApp() {
  const [users, setUsers] = useState<User[]>([]);
  const [selected, setSelected] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  // ========================================
  // โหลด Users
  // ========================================

  async function refreshUsers() {
    const res = await fetch("/api/users", {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("โหลด User ไม่สำเร็จ");
    }

    const data = await res.json();

    setUsers(data);
  }

  // ========================================
  // โหลด Messages
  // ========================================

  async function refreshMessages(
    lineUserId: string
  ) {
    const res = await fetch(
      `/api/messages?lineUserId=${encodeURIComponent(
        lineUserId
      )}`,
      {
        cache: "no-store",
      }
    );

    if (!res.ok) {
      throw new Error("โหลดข้อความไม่สำเร็จ");
    }

    const data = await res.json();

    setMessages(data);
  }

  // ========================================
  // Mark LINE Messages as Read
  // ========================================

  async function markAsRead(
    lineUserId: string
  ) {
    try {
      const res = await fetch(
        "/api/messages",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            lineUserId,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error(
          "Mark as read failed:",
          data
        );

        return;
      }

      console.log(
        "Mark as read result:",
        data
      );
    } catch (error) {
      console.error(
        "Mark as read error:",
        error
      );
    }
  }

  // ========================================
  // โหลด Users ทุก 3 วินาที
  // ========================================

  useEffect(() => {
    refreshUsers().catch((error) => {
      setError(
        error instanceof Error
          ? error.message
          : "โหลด User ไม่สำเร็จ"
      );
    });

    const timer = setInterval(() => {
      refreshUsers().catch(() => {});
    }, 3000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // ========================================
  // เปิด Chat
  // ========================================

  useEffect(() => {
    if (!selected) {
      setMessages([]);
      return;
    }

    const lineUserId =
      selected.lineUserId;

    async function openChat() {
      try {
        setError("");

        // 1. โหลดข้อความ
        await refreshMessages(
          lineUserId
        );

        // 2. Mark as Read
        await markAsRead(
          lineUserId
        );
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "เกิดข้อผิดพลาด"
        );
      }
    }

    openChat();

    // ========================================
    // Refresh Messages ทุก 2 วินาที
    // ========================================

    const timer = setInterval(() => {
      refreshMessages(
        lineUserId
      ).catch(() => {});
    }, 2000);

    return () => {
      clearInterval(timer);
    };
  }, [selected]);

  // ========================================
  // ส่งข้อความ Web Chat → LINE OA
  // ========================================

  async function send() {
    if (
      !selected ||
      !text.trim() ||
      sending
    ) {
      return;
    }

    setSending(true);
    setError("");

    try {
      const res = await fetch(
        "/api/messages",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            lineUserId:
              selected.lineUserId,
            text: text.trim(),
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            "ส่งข้อความไม่สำเร็จ"
        );
      }

      // ล้างช่องข้อความ
      setText("");

      // โหลดข้อความใหม่
      await refreshMessages(
        selected.lineUserId
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "เกิดข้อผิดพลาด"
      );
    } finally {
      setSending(false);
    }
  }

  // ========================================
  // Enter เพื่อส่ง
  // ========================================

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (e.key === "Enter") {
      e.preventDefault();

      send();
    }
  }

  // ========================================
  // UI
  // ========================================

  return (
    <main className="app">
      {/* Header */}

      <header className="header">
        <h1>LINE OA Web Chat</h1>

        <span className="status">
          ● Connected
        </span>
      </header>

      {/* Error */}

      {error && (
        <div className="notice">
          {error}
        </div>
      )}

      <div className="body">
        {/* ================================
            Sidebar
        ================================= */}

        <aside className="sidebar">
          <div className="sidebar-title">
            Users ({users.length})
          </div>

          {users.map((user) => (
            <button
              key={user.lineUserId}
              className={`user ${
                selected?.lineUserId ===
                user.lineUserId
                  ? "active"
                  : ""
              }`}
              onClick={() => {
                setSelected(user);
                setError("");
              }}
            >
              {user.pictureUrl ? (
                <img
                  className="avatar"
                  src={user.pictureUrl}
                  alt=""
                />
              ) : (
                <div className="avatar" />
              )}

              <div className="user-info">
                <div className="user-name">
                  {user.displayName}
                </div>
              </div>
            </button>
          ))}

          {!users.length && (
            <div className="empty">
              ยังไม่มี User
              <br />
              ส่งข้อความจาก LINE OA
              <br />
              เพื่อเริ่มทดสอบ
            </div>
          )}
        </aside>

        {/* ================================
            Chat
        ================================= */}

        <section className="chat">
          {selected ? (
            <>
              {/* Chat Header */}

              <div className="chat-head">
                <strong>
                  {selected.displayName}
                </strong>
              </div>

              {/* Messages */}

              <div className="messages">
                {messages.length ? (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`bubble-row ${
                        message.direction ===
                        "OUTBOUND"
                          ? "out"
                          : ""
                      }`}
                    >
                      <div>
                        <div
                          className={`bubble ${
                            message.direction ===
                            "OUTBOUND"
                              ? "out"
                              : "in"
                          }`}
                        >
                          {message.text}
                        </div>

                        <div className="meta">
                          {new Date(
                            message.createdAt
                          ).toLocaleString(
                            "th-TH"
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty">
                    ยังไม่มีข้อความ
                  </div>
                )}
              </div>

              {/* Composer */}

              <div className="composer">
                <input
                  value={text}
                  placeholder="พิมพ์ข้อความ..."
                  disabled={sending}
                  onChange={(e) =>
                    setText(
                      e.target.value
                    )
                  }
                  onKeyDown={
                    handleKeyDown
                  }
                />

                <button
                  className="send"
                  disabled={
                    sending ||
                    !text.trim()
                  }
                  onClick={send}
                >
                  {sending
                    ? "Sending..."
                    : "Send"}
                </button>
              </div>
            </>
          ) : (
            <div className="empty">
              เลือก User
              <br />
              เพื่อเริ่มสนทนา
            </div>
          )}
        </section>
      </div>
    </main>
  );
}