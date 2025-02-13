"use client";

import React, { useEffect, useRef } from "react";
import SimplePeer from "simple-peer";
import io from "socket.io-client";

const Page = () => {
  const [peers, setPeers] = React.useState<SimplePeer.Instance[]>([]);
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const socketRef = useRef<any>();
  const peersRef = useRef<Array<{ peerId: string; peer: SimplePeer.Instance }>>(
    []
  );

  useEffect(() => {
    // Socket.IO sunucusuna bağlan
    socketRef.current = io("http://localhost:3001");

    // Kullanıcının mikrofonuna erişim iste
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      setStream(stream);

      // Odaya katıl
      socketRef.current.emit("join-room");

      // Yeni kullanıcı katıldığında
      socketRef.current.on("user-joined", (payload: { peerId: string }) => {
        const peer = createPeer(payload.peerId, socketRef.current.id, stream);
        peersRef.current.push({ peerId: payload.peerId, peer });
        setPeers((users) => [...users, peer]);
      });

      // Gelen sinyal
      socketRef.current.on(
        "receiving-signal",
        (payload: { signal: any; id: string }) => {
          const item = peersRef.current.find((p) => p.peerId === payload.id);
          item?.peer.signal(payload.signal);
        }
      );

      // Mevcut kullanıcıları al
      socketRef.current.on("all-users", (users: string[]) => {
        users.forEach((userID) => {
          const peer = createPeer(userID, socketRef.current.id, stream);
          peersRef.current.push({ peerId: userID, peer });
          setPeers((users) => [...users, peer]);
        });
      });
    });

    return () => {
      // Temizlik işlemleri
      stream?.getTracks().forEach((track) => track.stop());
      socketRef.current?.disconnect();
    };
  }, []);

  function createPeer(
    userToSignal: string,
    callerID: string,
    stream: MediaStream
  ) {
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socketRef.current.emit("sending-signal", {
        userToSignal,
        callerID,
        signal,
      });
    });

    return peer;
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Sesli Sohbet Odası</h1>
      <div className="space-y-4">
        <div className="p-4 bg-gray-100 rounded">
          <p>Bağlı Kullanıcı Sayısı: {peers.length + 1}</p>
        </div>
        <div className="flex gap-4">
          <button
            className="px-4 py-2 bg-red-500 text-white rounded"
            onClick={() => {
              stream?.getAudioTracks().forEach((track) => {
                track.enabled = !track.enabled;
              });
            }}
          >
            Mikrofonu Aç/Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

export default Page;
