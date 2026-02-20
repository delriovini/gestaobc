"use client";

/** Extrai o ID numérico do Vimeo (aceita "123456" ou "https://vimeo.com/123456") */
function normalizeVimeoId(raw: string): string {
  const trimmed = String(raw).trim();
  const match = trimmed.match(/(?:vimeo\.com\/|video\/)(\d+)/);
  return match ? match[1] : trimmed.replace(/\D/g, "") || trimmed;
}

type VimeoPlayerProps = {
  vimeoId: string;
  lessonTitle: string;
};

export function VimeoPlayer({ vimeoId, lessonTitle }: VimeoPlayerProps) {
  const numericId = normalizeVimeoId(vimeoId);
  const embedUrl = `https://player.vimeo.com/video/${encodeURIComponent(numericId)}`;

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg border border-white/10 bg-black">
      <iframe
        src={embedUrl}
        className="h-full w-full min-h-[200px]"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title={lessonTitle}
      />
    </div>
  );
}
