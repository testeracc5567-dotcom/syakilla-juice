"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { useAuth } from "./AuthContext";
import {
  setPresence,
  isOnline as presIsOnline,
  getLastSeen as presGetLastSeen,
} from "@/lib/presence";

const ChatCtx = createContext(null);
const CHAT_KEY = "syk_chat_v1";
const GUEST_KEY = "syk_guest_v1";
const PRESENCE_KEY = "syk_presence_v1";

function readChat() {
  if (typeof window === "undefined") return { rooms: {} };
  try {
    return JSON.parse(localStorage.getItem(CHAT_KEY) || '{"rooms":{}}');
  } catch (e) {
    return { rooms: {} };
  }
}

function writeChat(data) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHAT_KEY, JSON.stringify(data));
  // Catatan: event 'storage' cuma kebaca di tab LAIN, jadi kita dispatch juga
  // event custom biar tab yang sekarang ikut ke-update realtime.
  window.dispatchEvent(new Event("syk-chat-update"));
}

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
  const [data, setData] = useState({ rooms: {} });
  const [activeRoom, setActiveRoom] = useState(null);
  const [presTick, setPresTick] = useState(0);

  const reload = useCallback(() => setData(readChat()), []);

  // Sinkronisasi chat + presence secara realtime (lintas-tab & dalam-tab).
  useEffect(() => {
    reload();
    const bumpPres = () => setPresTick((t) => t + 1);
    const onStorage = (e) => {
      if (!e || e.key === CHAT_KEY) reload();
      if (e && e.key === PRESENCE_KEY) bumpPres();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("syk-chat-update", reload);
    window.addEventListener("syk-presence-update", bumpPres);
    // Re-evaluasi status online tiap 10 detik biar "offline" kedeteksi.
    const iv = setInterval(bumpPres, 10000);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("syk-chat-update", reload);
      window.removeEventListener("syk-presence-update", bumpPres);
      clearInterval(iv);
    };
  }, [reload]);

  // Room = identitas percakapan. Pembeli login pakai email, tamu pakai guest id.
  const myRoom = useMemo(() => {
    if (isAdmin) return null;
    if (user && user.email) return user.email;
    return guestId();
  }, [isAdmin, user]);

  // Id presence: admin dianggap "admin", pembeli pakai room-nya.
  const presenceId = useMemo(
    () => (isAdmin ? "admin" : myRoom),
    [isAdmin, myRoom],
  );

  // Heartbeat: tandai diri sendiri online tiap 8 detik + saat tab balik aktif.
  useEffect(() => {
    if (!presenceId) return;
    setPresence(presenceId);
    const iv = setInterval(() => setPresence(presenceId), 8000);
    const onVis = () => {
      if (document.visibilityState === "visible") setPresence(presenceId);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(iv);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [presenceId]);

  const ensureRoom = useCallback((roomId, buyerName) => {
    const d = readChat();
    if (!d.rooms[roomId]) {
      d.rooms[roomId] = {
        id: roomId,
        buyerName: buyerName || "Pembeli",
        messages: [],
      };
      writeChat(d);
      setData(d);
    } else if (buyerName && d.rooms[roomId].buyerName !== buyerName) {
      d.rooms[roomId].buyerName = buyerName;
      writeChat(d);
      setData(d);
    }
  }, []);

  const sendMessage = useCallback(
    (text, opts) => {
      const t = (text || "").trim();
      if (!t) return;
      const options = opts || {};
      const roomId = isAdmin ? options.room || activeRoom : myRoom;
      if (!roomId) return;
      const d = readChat();
      if (!d.rooms[roomId]) {
        d.rooms[roomId] = {
          id: roomId,
          buyerName: isAdmin ? "Pembeli" : user && user.name ? user.name : "Tamu",
          messages: [],
        };
      }
      if (!isAdmin && user && user.name) d.rooms[roomId].buyerName = user.name;
      d.rooms[roomId].messages.push({
        id: Date.now() + "_" + Math.random().toString(36).slice(2, 6),
        from: isAdmin ? "admin" : "buyer",
        text: t,
        ts: Date.now(),
      });
      writeChat(d);
      setData({ ...d });
      // Kirim pesan = tanda kita online.
      if (presenceId) setPresence(presenceId);
    },
    [isAdmin, activeRoom, myRoom, user, presenceId],
  );

  // Daftar room buat admin (diurut dari yang paling baru).
  const rooms = useMemo(() => {
    const list = Object.values(data.rooms || {}).map((r) => {
      const msgs = r.messages || [];
      return { ...r, last: msgs[msgs.length - 1] || null };
    });
    list.sort((a, b) => (b.last ? b.last.ts : 0) - (a.last ? a.last.ts : 0));
    return list;
  }, [data]);

  const myMessages = useMemo(() => {
    if (isAdmin || !myRoom) return [];
    const r = data.rooms && data.rooms[myRoom];
    return r ? r.messages || [] : [];
  }, [data, isAdmin, myRoom]);

  // Helper status online (di-recompute tiap presTick berubah).
  const adminOnline = useMemo(() => presIsOnline("admin"), [presTick]);
  const isRoomOnline = useCallback((roomId) => presIsOnline(roomId), [presTick]);
  const roomLastSeen = useCallback(
    (roomId) => presGetLastSeen(roomId),
    [presTick],
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
      }}
    >
      {children}
    </ChatCtx.Provider>
  );
}

export function useChat() {
  return useContext(ChatCtx);
}