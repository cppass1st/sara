"use client";
import { useEffect, useState } from "react";

export default function VideoPlayer({ url }) {
  const [ReactPlayer, setReactPlayer] = useState(null);

  useEffect(() => {
    import("react-player/lazy").then((mod) => setReactPlayer(() => mod.default));
  }, []);

  if (!ReactPlayer) {
    return (
      <div className="flex items-center justify-center w-full h-[250px] text-gray-400">
        Loading player...
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl rounded-2xl overflow-hidden shadow-lg bg-white">
      <ReactPlayer
  url={url}
  controls
  width="100%"
  height="250px"
  config={{
    youtube: {
      playerVars: {
        cc_load_policy: 0, // субтитры по умолчанию выключены
        modestbranding: 1, // убирает крупный логотип YouTube
        rel: 0, // не показывает похожие видео после окончания
        iv_load_policy: 3, // отключает аннотации
      },
    },
  }}
/>

      
    </div>
  );
}
