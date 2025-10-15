"use client";
import { useState } from "react";

export default function SegmentMaker({ playerRef }) {
  const [segments, setSegments] = useState([]);
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [answer, setAnswer] = useState("");

  const now = () => (playerRef.current ? playerRef.current.getCurrentTime() : 0);

  const setStartNow = () => setStart(Number(now().toFixed(2)));
  const setEndNow = () => setEnd(Number(now().toFixed(2)));

  const add = () => {
    if (start == null || end == null || !answer.trim()) return;
    const seg = { start: Math.min(start, end), end: Math.max(start, end), answer: answer.trim() };
    setSegments([...segments, seg]);
    // авто-перенос стартовой точки к концу, чтобы быстрее размечать
    setStart(seg.end);
    setEnd(null);
    setAnswer("");
  };

  const copyJson = async () => {
    const text = JSON.stringify(segments, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      alert("Сегменты скопированы в буфер обмена!");
    } catch {
      alert("Не удалось скопировать — выдели текст ниже вручную.");
    }
  };

  return (
    <div className="mt-4 p-3 border rounded-lg bg-gray-50">
      <div className="text-sm font-semibold mb-2">DEV: разметка сегментов</div>

      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex flex-col">
          <label className="text-xs text-gray-500">Start</label>
          <input value={start ?? ""} readOnly className="w-28 px-2 py-1 border rounded-md bg-white" />
          <button onClick={setStartNow} className="mt-1 px-2 py-1 text-xs bg-blue-100 rounded-md">Set start = now</button>
        </div>

        <div className="flex flex-col">
          <label className="text-xs text-gray-500">End</label>
          <input value={end ?? ""} readOnly className="w-28 px-2 py-1 border rounded-md bg-white" />
          <button onClick={setEndNow} className="mt-1 px-2 py-1 text-xs bg-blue-100 rounded-md">Set end = now</button>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="text-xs text-gray-500">Текст реплики</label>
          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="введи услышанное…"
            className="w-full px-3 py-2 border rounded-md bg-white"
          />
        </div>

        <button onClick={add} className="px-3 py-2 bg-emerald-500 text-white rounded-md">Добавить сегмент</button>
      </div>

      <div className="mt-3">
        <button onClick={copyJson} className="px-3 py-2 bg-gray-800 text-white rounded-md">Скопировать JSON</button>
      </div>

      <pre className="mt-2 max-h-56 overflow-auto text-xs bg-white p-2 border rounded">{JSON.stringify(segments, null, 2)}</pre>
    </div>
  );
}
