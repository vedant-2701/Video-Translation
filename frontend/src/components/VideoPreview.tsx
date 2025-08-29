type VideoPreviewProps = {
    src: string;
    title: string;
    subtitleUrl?: string | null;
};

export default function VideoPreview({
    src,
    title,
    subtitleUrl,
}: VideoPreviewProps) {
    return (
        <div className="w-full">
            <h3 className="text-lg font-semibold text-brand-dark mb-2">
                {title}
            </h3>
            <div className="aspect-video w-full bg-gray-900 rounded-lg overflow-hidden shadow-lg">
                <video key={src} controls className="w-full h-full">
                    <source src={src} type="video/mp4" />
                    {subtitleUrl && (
                        <track
                            src={subtitleUrl}
                            kind="subtitles"
                            srcLang="en"
                            label="English"
                            default
                        />
                    )}
                    Your browser does not support the video tag.
                </video>
            </div>
        </div>
    );
}
