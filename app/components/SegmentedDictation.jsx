"use client";
import React, { useEffect, useRef, useState } from "react";
import { useLayoutEffect } from "react";
import { computeMaskedFirstError } from "../utils/compareText";
import Button from "./UI/Button";
import { flushSync } from "react-dom";
import SegmentMaker from "./SegmentMarker.jsx";

// --- МАЛЕНЬКИЕ ИКОНКИ ---
const Icon = {
  Play: (props) => (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" {...props}>
      <path d="M6.5 4.5v11l9-5.5-9-5.5z" />
    </svg>
  ),
  Pause: (props) => (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" {...props}>
      <path d="M6 5h3v10H6zm5 0h3v10h-3z" />
    </svg>
  ),
  Check: (props) => (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" {...props}>
      <path d="M7.5 13.5 4 10l1.5-1.5L7.5 10.5 14.5 3.5 16 5z" />
    </svg>
  ),
  Broom: (props) => (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" {...props}>
      <path d="M15 3l6 6-1.5 1.5-1.8-1.8-6.9 6.9c-.8.8-1.9 1.2-3 1.2H3v-3.8c0-1.1.4-2.2 1.2-3l6.9-6.9L13.5 3 15 3z" />
    </svg>
  ),
  Eye: (props) => (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" {...props}>
      <path d="M12 5C7 5 2.7 8.1 1 12c1.7 3.9 6 7 11 7s9.3-3.1 11-7c-1.7-3.9-6-7-11-7zm0 12a5 5 0 110-10 5 5 0 010 10z" />
    </svg>
  ),
  ArrowRight: (props) => (
    <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor" {...props}>
      <path d="M11 5l5 5-5 5v-3H4V8h7V5z" />
    </svg>
  ),
};

export default function SegmentedDictation({ lesson, onComplete }) {
  const playerRef = useRef(null);
  const [ReactPlayer, setReactPlayer] = useState(null);

  const [idx, setIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [text, setText] = useState("");
  const [hint, setHint] = useState(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const inputRef = useRef(null);
  const sizerRef = useRef(null);
  const translateMeasureRef = useRef(null);

  const [translateTop, setTranslateTop] = useState(0);
  const [reservePB, setReservePB] = useState(0);
  const notifiedCompleteRef = useRef(false);

const onTextKeyDown = (e) => {
  // Intercept Enter (but allow Shift+Enter for newlines)
  if (e.key !== "Enter" || e.shiftKey) return;
  e.preventDefault();

  // If the current answer is already correct, move to the next segment
  if (isCorrect) {
    onNext();
    return;
  }

  // Apply the check synchronously so state updates are flushed immediately
  flushSync(() => {
    onCheck();
  });

  /*
    When triggering a check via the Enter key we avoid forcing an immediate
    resize via nested requestAnimationFrame calls. In previous versions we
    attempted to re-measure and adjust the height right away, but this ran
    before the translation content had been inserted into the DOM, leading
    to an incorrect container height. Instead, we schedule the resize on
    the next macrotask using setTimeout(0). By this point React has
    committed the new DOM (including the translation) and the browser has
    performed a layout, ensuring that autoResize() will measure the correct
    height for both the text and translation.
  */
  setTimeout(() => {
    autoResize();
  }, 0);
};



const measure = () => {
   const sizer = sizerRef.current;
   if (!sizer) return;
   // высота текста + верхний паддинг; минус нижний паддинг
   const styles = getComputedStyle(sizer);
   const padBottom = parseFloat(styles.paddingBottom) || 0; // p-3 == 12px
   setTranslateTop(sizer.scrollHeight - padBottom);
};

const autoResize = () => {
  const el = inputRef.current;
  const sizer = sizerRef.current;
  const tSizer = translateMeasureRef.current;
  if (!el || !sizer) return;

  const cs = getComputedStyle(sizer);
  const lineH = parseFloat(cs.lineHeight) || 24;
  const pt = parseFloat(cs.paddingTop) || 12;
  const pb = parseFloat(cs.paddingBottom) || 12;
  const minTwoLines = lineH * 2 + pt + pb;

  const textH = sizer.scrollHeight;
  const translationH = isCorrect && seg.translation && tSizer ? tSizer.scrollHeight : 0;

  const finalH = Math.max(minTwoLines, textH + translationH);

  el.style.height = "auto";
  void el.offsetHeight;          // ← форсируем reflow, чтобы следующее значение применилось корректно
  el.style.height = `${finalH}px`;
  el.style.overflowY = "hidden";

  setReservePB(0);
  measure();
};

useEffect(() => {
  if (!isCorrect) return;
  // как только ответ стал верным и перевод попал в DOM —
  // ждём 2 кадра и пересчитываем высоту
  const id1 = requestAnimationFrame(() => {
    const id2 = requestAnimationFrame(() => {
      autoResize();
    });
    // на случай размонтирования между кадрами
    return () => cancelAnimationFrame(id2);
  });
  return () => cancelAnimationFrame(id1);
}, [isCorrect, idx, text]);

useEffect(() => {
  if (typeof ResizeObserver === "undefined") {
    const id = setInterval(() => autoResize(), 50);
    return () => clearInterval(id);
  }
  const ro = new ResizeObserver(() => autoResize());

  const s = sizerRef.current;
  const t = translateMeasureRef.current;
  if (s) ro.observe(s);
  if (t) ro.observe(t);

  autoResize();
  return () => ro.disconnect();
}, [idx, isCorrect]); // ← было [idx]

// пересчитываем при смене реплики / вводе / появлении перевода
useLayoutEffect(() => {
  autoResize();
}, [idx, isCorrect, text]);


  // ключ прогресса для конкретного урока
const PROGRESS_KEY = `sara:progress:${lesson.id}`;


// загружаем прогресс при входе
useEffect(() => {
  const saved = localStorage.getItem(PROGRESS_KEY);
  if (saved) {
    const n = Number(saved);
    if (!Number.isNaN(n) && n >= 0 && n < lesson.segments.length) setIdx(n);
  }
}, [lesson.id]);

// сохраняем прогресс после перехода
useEffect(() => {
  localStorage.setItem(PROGRESS_KEY, String(idx));
}, [idx, PROGRESS_KEY]);

  useEffect(() => {
    import("react-player/lazy").then((mod) => setReactPlayer(() => mod.default));
  }, []);
  useEffect(() => {
  if (inputRef.current) inputRef.current.focus();
}, [idx]);


  const seg = lesson.segments[idx];

  const playSegment = () => {
    if (!playerRef.current || !seg) return;
    playerRef.current.seekTo(seg.start, "seconds");
    setIsPlaying(true);
  };

  const onProgress = ({ playedSeconds }) => {
    if (!seg) return;
    if (playedSeconds >= seg.end) setIsPlaying(false);
  };

  const onCheck = () => {
    const res = computeMaskedFirstError(seg.answer, text);
    setHint(res);
    setIsCorrect(res && res.errorWord === null);
  };

const onNext = () => {
  if (idx < lesson.segments.length - 1) {
    setIdx(idx + 1);
    setText("");
    setHint(null);
    setIsCorrect(false);
    setIsPlaying(false);

  }
};


const onReveal = () => {
  const ans = seg.answer;
  setText(ans);

  // НЕ помечаем как верный и не показываем баннер
  setIsCorrect(false);
  setHint(null);

  // вернуть фокус в поле и поставить курсор в конец
  requestAnimationFrame(() => {
    if (inputRef.current) {
      const el = inputRef.current;
      el.focus();
      const len = ans.length;
      try { el.setSelectionRange(len, len); } catch {}
    }
  });
};


  const finished = idx === lesson.segments.length - 1 && isCorrect;
  // Сообщаем родителю о завершении урока один раз
 useEffect(() => {
   if (finished && !notifiedCompleteRef.current) {
     notifiedCompleteRef.current = true;
     onComplete?.(); // вызов, если передан
   }
 }, [finished, onComplete]);
 
 // Сбрасываем флаг, если ушли с последней реплики или ответ стал неверным
 useEffect(() => {
   if (!finished) {
     notifiedCompleteRef.current = false;
   }
 }, [finished, idx, isCorrect]);

  return (
    
    <div className="w-full max-w-xl bg-white rounded-2xl shadow p-4 mt-4">
      <h2 className="text-2xl font-bold mb-3 text-gray-800 tracking-tight">{lesson.title}</h2>

      {!ReactPlayer ? (
  <div className="flex items-center justify-center h-[220px] text-gray-400">
    Loading player...
  </div>
) : (
  <>
    <ReactPlayer
      ref={playerRef}
      url={lesson.url}
      controls
      playing={isPlaying}
      width="100%"
      height="220px"
      onProgress={onProgress}
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
  {/* 👇 Юридический дисклеймер */}
      <div className="text-xs text-gray-500 text-center p-2 border-t bg-gray-50">
        Видео встроено через YouTube и принадлежит его правообладателям.
        <br />
        Источник:{" "}
        <a
          href={lesson.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {lesson.url}
        </a>
      </div>
    {/* ⚙️ Временная панель для создания сегментов (DEV mode) 
    <SegmentMaker playerRef={playerRef} />*/}
  </>
)}

 <div className="h-1 bg-gray-200 rounded-full mt-2">
  <div className="h-1 bg-blue-500 rounded-full" style={{ width: `${(idx+1)/lesson.segments.length*100}%` }} />
</div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Реплика {idx + 1} из {lesson.segments.length}
          <span className="ml-2 text-gray-400">({seg.start}s – {seg.end}s)</span>
        </div>

        <div className="flex gap-2">
          <Button
  variant="primary"
  onClick={playSegment}
  leftIcon={<Icon.Play />}
  pressOnClick        // ← вжатие при клике
>
  Прослушать реплику
</Button>

{/*<Button variant="muted" onClick={() => setIsPlaying(false)} leftIcon={<Icon.Pause />}>
  Пауза
</Button>*/}

        </div>
      </div>

<div className="relative mt-3" style={{ paddingBottom: reservePB }}>
  {/* Невидимый sizer текста */}
<div
  ref={sizerRef}
  className="absolute invisible -z-10 whitespace-pre-wrap break-words font-sans text-base leading-6 p-3 pr-28 w-full"
  style={{ whiteSpace: "pre-wrap" }}
>
  {text || "Печатай то, что услышал в этой реплике..."}
</div>

{/* Невидимый измеритель перевода (та же типографика и ширина, что у видимого перевода) */}
<div
  ref={translateMeasureRef}
  className="absolute invisible -z-10 text-base leading-6 font-normal font-sans"
  style={{ left: 12, right: 28 + 12, whiteSpace: "pre-wrap" }}
>
  {isCorrect && seg.translation ? seg.translation : ""}
</div>


<textarea
  ref={inputRef}
  value={text}
  onChange={(e) => setText(e.target.value)}
  onInput={autoResize}         // чтобы рост шёл при обычном вводе и Shift+Enter
  onKeyDown={onTextKeyDown}
  placeholder="Печатай то, что услышал в этой реплике..."
  className="w-full p-3 pr-28 border rounded-md resize-none focus:outline-none text-base leading-6 overflow-hidden font-sans bg-white"
/>


  {/* Перевод: та же типографика, встает ровно на следующую строку за введённым текстом */}
  {isCorrect && seg.translation && (
    <div
      className="absolute text-base leading-6 font-normal font-sans pointer-events-none"
      style={{
        left: 12,          // p-3 = 12px
        top: translateTop, // рассчитанная позиция "ровно под текстом"
        color: "#3d8a00",
        whiteSpace: "pre-wrap",
        right: 28 + 12,    // чтобы не залезать под кнопку «Показать ответ» (pr-28) + левый паддинг
      }}
    >
      {seg.translation}
    </div>
  )}

  {/* «Показать ответ» — оставляем как было */}
  {!isCorrect && (
    <button
      type="button"
      onClick={() => {
        onReveal();
        requestAnimationFrame(() => {
          autoResize();
        });
      }}
      className="absolute top-2 right-3 text-emerald-600 text-sm hover:underline focus:outline-none"
    >
      Показать ответ
    </button>
  )}
</div>







{/* Подсказка об ошибке (когда есть, и ответ ещё не верный) */}
{hint && !isCorrect && (
  <div className="mt-3 p-3 border rounded-md bg-gray-50 text-sm">
    <span className="font-semibold">Подсказка: </span>
    {hint.errorWord ? (
      <>
        {hint.prefix && <span>{hint.prefix} </span>}
        <span className="text-red-600 font-semibold">{hint.errorWord}</span>{" "}
        <span className="text-gray-400">***</span>
      </>
    ) : (
      <span className="text-green-600 font-semibold">Всё верно!</span>
    )}
  </div>
)}

{/* ↓ Здесь либо кнопки действий, либо зелёный баннер успеха ↓ */}
{!isCorrect ? (
  <div className="flex items-center gap-3 mt-3">
    <Button variant="primary" onClick={onCheck} leftIcon={<Icon.Check />}>
      Проверить
    </Button>
    {/* при желании можно вернуть Очистить/Пауза */}
  </div>
) : (
<div
  className="mt-3 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between animate-fadeIn"
  style={{ backgroundColor: "#d4f8b3", border: "1px solid #b9e69c" }}
>
  <div className="flex items-center gap-3">
    <div
      className="flex items-center justify-center rounded-full shrink-0"
      style={{
        width: "40px",
        height: "40px",
        backgroundColor: "#ffffff",
        color: "#3d8a00",
        fontSize: "22px",
        fontWeight: "bold",
      }}
    >
      ✓
    </div>

    <div className="font-semibold text-lg" style={{ color: "#3d8a00" }}>
      Прекрасно!
    </div>
  </div>

  <button
    onClick={onNext}
    className="mt-3 sm:mt-0 px-6 py-2 rounded-lg text-white font-semibold transition-transform active:scale-[0.98]"
    style={{ backgroundColor: "#3d8a00", boxShadow: "0 2px 0 #2e6b00" }}
  >
    Далее
  </button>
</div>



)}




      {finished && (
        <div className="mt-4 p-3 border rounded-md bg-emerald-50">
          🎉 Отлично! Все реплики собраны. Можешь пересмотреть всю сцену столько раз, сколько хочешь.
        </div>
      )}
    </div>
  );
}
