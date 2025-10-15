"use client";
import { useEffect, useState } from "react";
import SegmentedDictation from "./components/SegmentedDictation";
import LessonList from "./components/LessonList";
import lessonsData from "./data/lessons.json";
import FeedbackBar from "./components/FeedbackBar";


export default function Home() {
const [isClient, setIsClient] = useState(false);
const [selectedId, setSelectedId] = useState<number | null>(null);
// 👇 ДОБАВИЛИ флаг завершения сцены
const [isCompleted, setIsCompleted] = useState(false);

useEffect(() => setIsClient(true), []);
useEffect(() => {
const saved = localStorage.getItem("sara:lastLessonId");
if (saved) setSelectedId(Number(saved));
}, []);
useEffect(() => {
if (selectedId != null) localStorage.setItem("sara:lastLessonId", String(selectedId));
setIsCompleted(false);

}, [selectedId]);


const lessons = lessonsData as unknown as Array<any>;
const selected = lessons.find((l) => l.id === selectedId) || null;
// 👇 Колбэк: SegmentedDictation должен вызвать его при “успешно пройдено”
const handleLessonComplete = () => setIsCompleted(true);


return (
<div className="flex flex-col items-center justify-start min-h-screen p-6 bg-gray-50">
<div className="flex items-center gap-2 mb-6 select-none">
  <div className="bg-blue-600 text-white font-bold text-2xl px-3 py-2 rounded-xl shadow-sm">
    Sara
  </div>
  <span className="text-2xl font-semibold text-gray-700">listening</span>
</div>


{!isClient ? (
<div className="flex items-center justify-center h-[250px] text-gray-400">
Loading...
</div>
) : selected ? (
<div className="w-full flex flex-col items-center">
<div className="w-full max-w-xl mb-3">
<button
onClick={() => setSelectedId(null)}
className="text-sm text-gray-600 hover:text-gray-900"
>
← Назад к списку сцен
</button>
</div>
{/* 👇 ПЕРЕДАЁМ onComplete — пусть SegmentedDictation вызовет его при успехе */}
          <SegmentedDictation lesson={selected} onComplete={handleLessonComplete} />

          {/* 👇 Рендерим панель отзывов ПОД сценой; показываем после успеха */}
          <FeedbackBar lessonId={selected.id} visible={isCompleted} />

          {/*
            Временный вариант на время интеграции:
            Если SegmentedDictation пока НЕ вызывает onComplete,
            можешь на время поставить visible={true}, чтобы потестить отправку:
            <FeedbackBar lessonId={selected.id} visible={true} />
          */}
        </div>
      ) : (
        <LessonList lessons={lessons} onSelect={setSelectedId} />
      )}
</div>
);
}