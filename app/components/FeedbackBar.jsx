"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// --------- Константы поведения ----------
const EDIT_WINDOW_MS = 2 * 60 * 1000;   // 2 минуты на одну правку
const THROTTLE_MS    = 10 * 60 * 1000;  // 10 минут между новыми отзывами

// ---------- Вспомогалки ----------
function storageKey(lessonId) {
  return `fb_state_${lessonId}`;
}

// Сохраняем локальное состояние для урока:
// { lastId: string, firstSubmittedAt: number, editedOnce: boolean }
function loadState(lessonId) {
  try {
    const raw = localStorage.getItem(storageKey(lessonId));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveState(lessonId, state) {
  localStorage.setItem(storageKey(lessonId), JSON.stringify(state));
}

// Хэш UA (не персональные данные, просто технический идентификатор)
function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h;
}

export default function FeedbackBar({ lessonId, visible = true }) {
  const [rating, setRating]   = useState(null); // 'up' | 'down'
  const [comment, setComment] = useState("");
  const [status, setStatus]   = useState("idle");   // idle | submitting | done | editing | error
  const [errorMsg, setErrorMsg] = useState("");

  // Локальный state из памяти
  const [fbState, setFbState] = useState(null); // { lastId, firstSubmittedAt, editedOnce }
  const [now, setNow] = useState(Date.now());   // для таймера обратного отсчёта

  // Подтягиваем state при маунте/смене урока
  useEffect(() => {
    if (!visible) return;
    const s = loadState(lessonId);
    setFbState(s);
  }, [lessonId, visible]);

  // Тик раз в секунду для обратного отсчёта окна редактирования
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Посчитаем, можно ли править и можно ли отправлять новый
  const canEditNow = useMemo(() => {
    if (!fbState?.firstSubmittedAt || fbState?.editedOnce) return false;
    return now - fbState.firstSubmittedAt <= EDIT_WINDOW_MS;
  }, [fbState, now]);

  const canSendNew = useMemo(() => {
    // новый отзыв (НЕ правка) можно отправить спустя 10 минут
    if (!fbState?.firstSubmittedAt) return true; // ещё ничего не отправляли
    return now - fbState.firstSubmittedAt > THROTTLE_MS;
  }, [fbState, now]);

  // Оставим быструю подсказку в UI
  const editSecondsLeft = canEditNow
    ? Math.max(0, Math.ceil((fbState.firstSubmittedAt + EDIT_WINDOW_MS - now) / 1000))
    : 0;

  if (!visible) return null;

  const pick = (val) => {
    if (status === "done") return;
    setRating(val);
    setErrorMsg("");
  };

  const startEdit = () => {
    // Разрешаем отредактировать уже отправленный отзыв в течение окна
    setStatus("editing");
    // rating/comment оставим как есть — пользователь может ввести новые
  };

  const submit = async () => {
    if (!lessonId) return;
    if (!rating) return;

    // Валидации
    if (!canEditNow && !canSendNew) {
      setStatus("error");
      setErrorMsg("Слишком часто: новый отзыв можно отправить через несколько минут 🙏");
      return;
    }
    if (rating === "down" && comment.trim().length < 10) {
      setStatus("error");
      setErrorMsg("Для 👎 добавь, пожалуйста, хотя бы 10 символов комментария.");
      return;
    }

    setStatus("submitting");
    setErrorMsg("");

    try {
      const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
      const ua_hash = ua ? String(hashCode(ua)) : null;

      // Если это правка в 2-минутное окно — вставляем новую строку с replaces_id = старый id
      const replaces_id = canEditNow && fbState?.lastId ? fbState.lastId : null;

      const { data, error } = await supabase
        .from("feedback")
        .insert({
          user_id: null,                 // позже подставим user.id
          lesson_id: String(lessonId),
          rating,
          comment: comment.trim() || null,
          ua_hash,
          replaces_id,
        })
        .select("id")

      if (error) {
        console.error("[Supabase insert error]", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
    });
        throw error;
      }

    if (!data || !Array.isArray(data) || data.length === 0) {
    console.error("[Supabase insert] No data returned");
    throw new Error("No rows returned from insert");
}

const insertedId = data[0].id;
      // Обновляем локальную память:
      // - при первой отправке — фиксируем момент firstSubmittedAt
      // - при правке — помечаем editedOnce = true, но НЕ сбрасываем firstSubmittedAt
      const nowTs = Date.now();
      const nextState = {
        lastId: data.id,
        firstSubmittedAt: fbState?.firstSubmittedAt ?? nowTs,
        editedOnce: replaces_id ? true : (fbState?.editedOnce ?? false),
      };
      saveState(lessonId, nextState);
      setFbState(nextState);

      setStatus("done");
    } catch (e) {
      console.error(e);
      setStatus("error");
      setErrorMsg("Не удалось отправить отзыв. Проверь соединение и попробуй ещё раз.");
    }
  };

  const reset = () => {
    setRating(null);
    setComment("");
    setStatus("idle");
    setErrorMsg("");
  };

  return (
    <div className="mt-4 w-full max-w-xl bg-white rounded-md border p-4 shadow-sm">
      {status !== "done" ? (
        <>
          <div className="flex items-center justify-between gap-2">
            <div className="text-gray-800 font-medium">Понравился ли урок?</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => pick("up")}
                className={`px-3 py-2 rounded-md border transition ${
                  rating === "up" ? "bg-green-100 border-green-300" : "bg-white hover:bg-gray-50"
                }`}
                aria-pressed={rating === "up"}
              >
                👍 Нравится
              </button>
              <button
                onClick={() => pick("down")}
                className={`px-3 py-2 rounded-md border transition ${
                  rating === "down" ? "bg-red-100 border-red-300" : "bg-white hover:bg-gray-50"
                }`}
                aria-pressed={rating === "down"}
              >
                👎 Можно лучше
              </button>
            </div>
          </div>

          {rating && (
            <div className="mt-3">
              <label className="block text-sm text-gray-600 mb-1">
                Хочешь добавить комментарий? (опционально)
                {rating === "down" && <span className="text-red-500"> • желательно</span>}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  rating === "up" ? "Что особенно понравилось?" : "Что было неудобно / что улучшить?"
                }
                className="w-full min-h-24 p-3 border rounded-md resize-y focus:outline-none"
                maxLength={600}
              />
            </div>
          )}

          {status === "error" && (
            <div className="mt-2 text-sm text-red-600">{errorMsg}</div>
          )}

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={submit}
              disabled={!rating || status === "submitting"}
              className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-50"
            >
              {status === "submitting" ? "Отправляем..." : canEditNow ? "Сохранить правку" : "Отправить"}
            </button>

            {rating && (
              <button
                type="button"
                onClick={reset}
                className="px-3 py-2 rounded-md border bg-white hover:bg-gray-50"
              >
                Сбросить
              </button>
            )}

            {/* Подсказка о правке / лимитах */}
            {canEditNow && (
              <span className="text-xs text-gray-500">
                Можно изменить ещё {Math.floor(editSecondsLeft / 60)}:{String(editSecondsLeft % 60).padStart(2, "0")}
              </span>
            )}
            {!canEditNow && !canSendNew && (
              <span className="text-xs text-gray-500">
                Новый отзыв можно будет отправить позже.
              </span>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-green-700 font-medium">
            Спасибо! Отзыв учтён 🙌
            {fbState?.editedOnce && <span className="ml-2 text-green-800/70">(отредактировано)</span>}
          </div>

          <div className="flex items-center gap-2">
            {canEditNow && (
              <button
                onClick={startEdit}
                className="px-3 py-2 rounded-md border bg-white hover:bg-gray-50"
              >
                Изменить отзыв ({Math.floor(editSecondsLeft / 60)}:{String(editSecondsLeft % 60).padStart(2, "0")})
              </button>
            )}
            <button
              onClick={reset}
              className="px-3 py-2 rounded-md border bg-white hover:bg-gray-50"
            >
              Новый отзыв
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
