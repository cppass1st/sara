// app/utils/compareText.js
/**
 * Возвращает:
 * {
 *   prefix: строка — корректные слова до первой ошибки (может быть ""),
 *   errorWord: строка — правильное слово на позиции первой ошибки,
 *   firstErrorIndex: число | null
 * }
 *
 * Логика:
 * - сравниваем по словам (split по пробелам);
 * - нормализуем слова (нижний регистр, убираем крайние знаки препинания для сравнения, но в output сохраняем оригинал);
 * - первая ошибка — либо слово отличается, либо пользователь кончился (input короче).
 */
export function computeMaskedFirstError(correct = "", input = "") {
  // Простая токенизация по пробелам — сохраняем знаки препинания в самом слове,
  // но для сравнения убираем пунктуацию конца/начала.
  const splitWords = (s) => (s || "").trim().split(/\s+/).filter(Boolean);

  const normalize = (w) =>
    (w || "")
      .toLowerCase()
      // сохраняем апострофы (для I'll), убираем другие не-словесные символы
      .replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, "");

  const correctWords = splitWords(correct);
  const inputWords = splitWords(input);

  // Найти индекс первой ошибки
  let firstErrorIndex = null;
  for (let i = 0; i < correctWords.length; i++) {
    const corr = correctWords[i];
    const inp = inputWords[i];

    if (inp === undefined) {
      // пользователь не ввёл слово — это первая ошибка (пропуск)
      firstErrorIndex = i;
      break;
    }

    if (normalize(corr) !== normalize(inp)) {
      // различаются — первая ошибка
      firstErrorIndex = i;
      break;
    }
    // иначе совпало — продолжаем
  }

  if (firstErrorIndex === null) {
    // нет ошибок — показываем весь корректный текст, errorIndex null
    return {
      prefix: correctWords.join(" "),
      errorWord: null,
      firstErrorIndex: null,
    };
  }

  const prefix = correctWords.slice(0, firstErrorIndex).join(" ");
  const errorWord = correctWords[firstErrorIndex];

  return { prefix, errorWord, firstErrorIndex };
}
