"use client";
import Image from "next/image";


export default function LessonList({ lessons, onSelect }) {
return (
<div className="w-full max-w-3xl">
<h2 className="text-xl font-semibold mb-4">Выбери сцену</h2>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
{lessons.map((l) => (
<button
key={l.id}
onClick={() => onSelect(l.id)}
className="text-left bg-white rounded-2xl shadow hover:shadow-md transition p-3 group"
>
<div className="relative w-full h-40 bg-gray-100 rounded-xl overflow-hidden">
{l.thumbnail ? (
<Image
src={l.thumbnail}
alt={l.title}
fill
className="object-cover group-hover:scale-[1.02] transition"
/>
) : (
<div className="w-full h-full flex items-center justify-center text-gray-400">
no thumbnail
</div>
)}
</div>
<div className="mt-3">
<div className="font-medium">{l.title}</div>
<div className="text-sm text-gray-500">
{l.segments.length} репл.
</div>
</div>
</button>
))}
</div>
</div>
);
}