"use client";
// Chat sekarang jalan LEWAT SERVER (Firestore) via /api/chat.
// Jadi pesan pembeli masuk ke admin walau beda browser / beda HP.
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";

const ChatCtx = createContext(null);
const GUEST_KEY = "syk_guest_v1";
const POLL_MS = 4000;
const ONLINE_WINDOW = 30000;

function guestId() {
  if (typeof window === "undefined") return null;
  let id = localStorage.getItem(GUEST_KEY);
  if (!id) {
    id = "guest_" + Math.random().toString(36).slice(2, 9);
    localStorage.setItem(GUEST_KEY, id);
  }
  return id;
}

export function ChatProvider({ children }) {
  const { user, isAdmin } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [myMessages, setMyMessages] = useState([]);
  const [presence, setPresence] = useState({});
  const [now, setNow] = useState(Date.now());
  const [activeRoom, setActiveRoom] = useState(null);
  const busy = useRef(false);

  const myRoom = useMemo(() => {
    if (isAdmin) return null;
    if (user && user.email) return user.email;
    return guestId();
  }, [isAdmin, user]);

  const myName = user && user.name ? user.name : "Tamu";

  const load = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const qs = isAdmin ? "" : myRoom ? "?room=" + encodeURIComponent(myRoom) : "";
      const res = await fetch("/api/chat" + qs, { cache: "no-store" });
      const j = await res.json();
      if (j && j.presence) setPresence(j.presence);
      if (isAdmin) {
        if (j && Array.isArray(j.rooms)) setRooms(j.rooms);
      } else if (j && Array.isArray(j.messages)) {
        setMyMessages(j.messages);
      }
      setNow(Date.now());
    } catch (e) {
    } finally {
      busy.current = false;
    }
  }, [isAdmin, myRoom]);

  useEffect(() => {
    load();
    const iv = setInterval(load, POLL_MS);
    const tick = setInterval(() => setNow(Date.now()), 10000);
    const onVis = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(iv);
      clearInterval(tick);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [load]);

  const ensureRoom = useCallback(() => {}, []);

  const sendMessage = useCallback(
    (text, opts) => {
      const t = (text || "").trim();
      if (!t) return;
      const options = opts || {};
      const roomId = isAdmin ? options.room || activeRoom : myRoom;
      if (!roomId) return;
      const ts = Date.now();
      const temp = {
        id: "tmp_" + ts,
        roomId,
        from: isAdmin ? "admin" : "buyer",
        buyerName: myName,
        text: t,
        ts,
      };
      if (isAdmin) {
        setRooms((prev) =>
          prev.map((r) =>
            r.id === roomId
              ? { ...r, messages: (r.messages || []).concat(temp), last: temp }
              : r,
          ),
        );
      } else {
        setMyMessages((prev) => prev.concat(temp));
      }
      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, text: t, buyerName: myName }),
      })
        .then(() => load())
        .catch(() => {});
    },
    [isAdmin, activeRoom, myRoom, myName, load],
  );

  const adminOnline = useMemo(
    () => !!presence.admin && now - presence.admin < ONLINE_WINDOW,
    [presence, now],
  );
  const isRoomOnline = useCallback(
    (roomId) => !!roomId && !!presence[roomId] && now - presence[roomId] < ONLINE_WINDOW,
    [presence, now],
  );
  const roomLastSeen = useCallback(
    (roomId) => (roomId && presence[roomId]) || 0,
    [presence],
  );

  return (
    <ChatCtx.Provider
      value={{
        isAdmin,
        rooms,
        myMessages,
        myRoom,
        activeRoom,
        setActiveRoom,
        ensureRoom,
        sendMessage,
        adminOnline,
        isRoomOnline,
        roomLastSeen,
        refreshChat: load,
      }}
    >
      {children}
    </ChatCtx.Provider>
  );
}

export function useChat() {
  return useContext(ChatCtx);
}
