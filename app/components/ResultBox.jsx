"use client";

export default function ResultBox({ diff }) {
  // diff — результат computeDiff: [{type, text}, ...]
  return (
    <div className="p-4 border-t">
      <h3 className="font-semibold mb-2">Результат:</h3>
      <div className="flex flex-wrap gap-1">
        {diff.map((seg, idx) => {
          if (seg.type === 0) {
            return (
              <span key={idx} className="px-1">
                {seg.text}
              </span>
            );
          }
          if (seg.type === -1) {
            // в правильном тексте было, пользователь пропустил
            return (
              <span key={idx} className="px-1 bg-red-200 rounded">
                {seg.text}
              </span>
            );
          }
          // seg.type === 1 — введено лишнее
          return (
            <span key={idx} className="px-1 bg-green-200 rounded">
              {seg.text}
            </span>
          );
        })}
      </div>
    </div>
  );
}
